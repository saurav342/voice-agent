import { Router, type Request, type Response } from "express";
import { ObjectId } from "mongodb";

import type { Call, Did } from "@voiceplatform/shared";

import { getDb } from "../db/connection.js";
import { requireAuth } from "../middleware/auth.js";
import { requireTenant, tenantScope } from "../middleware/tenant.js";
import { createVoicelinkProvider } from "../adapters/telephony/voicelink/index.js";
import { createLogger } from "../lib/logger.js";
import { killCallSession, killAgentCallSessions } from "../voice-engine/session-manager.js";
import { analyzeCall } from "../lib/analyzer.js";

const log = createLogger("calls");

export const callsRouter = Router();

callsRouter.use(requireAuth, requireTenant);

/**
 * POST /calls/dial — place a single outbound call from the UI ("call me").
 * Body: { toNumber: string, didId?: string }.
 * Picks the tenant's active DID (or the given one), dials toNumber, and
 * connects the call to our WS bot so the agent talks. Indian numbers are
 * normalized to national + country_code inside the provider.
 */
callsRouter.post("/dial", async (req: Request, res: Response) => {
  const reqBody = (req.body as {
    toNumber?: unknown;
    didId?: unknown;
    agentId?: unknown;
    name?: string;
    customer_name?: string;
    customData?: Record<string, unknown>;
  }) || {};
  const toNumber = String(reqBody.toNumber ?? "").trim();
  const didId = reqBody.didId;
  const name = reqBody.name || reqBody.customer_name;
  const customData: Record<string, string> = {};

  if (reqBody.customData && typeof reqBody.customData === "object") {
    for (const [k, v] of Object.entries(reqBody.customData)) {
      if (v !== undefined && v !== null) customData[k] = String(v);
    }
  }
  if (name) {
    customData.name = String(name);
    customData.customer_name = String(name);
  }

  if (!/^[0-9+]{6,15}$/.test(toNumber)) {
    res.status(400).json({ error: "toNumber must be 6-15 digits (with optional leading +)" });
    return;
  }

  const dids = getDb().collection<Did>("dids");
  const did = typeof didId === "string" && didId.length > 0
    ? await dids.findOne(tenantScope(req, { _id: didId }))
    : await dids.findOne(tenantScope(req, { status: "active" }));
  if (!did) {
    res.status(404).json({ error: "no active DID for this tenant" });
    return;
  }

  const reqAgentId = reqBody.agentId;
  const targetAgentId = typeof reqAgentId === "string" && reqAgentId.length > 0
    ? reqAgentId
    : (did.defaultAgentId || "pending");

  const wsBase = process.env.WS_BASE_URL;
  if (!wsBase) {
    res.status(503).json({ error: "WS_BASE_URL not configured (start the public tunnel)" });
    return;
  }
  const httpBase = wsBase.replace(/^wss:/, "https:").replace(/^ws:/, "http:");
  const callId = new ObjectId().toString();
  const websocketUrl = `${wsBase}/ws/voicelink/${did._id}?callId=${callId}`;
  const webhookUrl = `${httpBase}/webhooks/voicelink`;

  try {
    const provider = createVoicelinkProvider();
    const handle = await provider.originateCall({
      fromDid: did.providerNumber,
      toNumber,
      websocketUrl,
      webhookUrl,
      customParameters: JSON.stringify({
        callId,
        agentId: targetAgentId,
        tenantId: req.tenantId,
        ...customData,
      }),
    });

    const db = getDb();
    const now = new Date();
    const call: Call = {
      _id: callId,
      tenantId: req.tenantId!,
      agentId: targetAgentId,
      direction: "out",
      providerCallId: handle.providerCallId,
      fromNumber: did.providerNumber,
      toNumber,
      startedAt: handle.acceptedAt,
      durationSec: 0,
      status: "ringing",
      sentiment: "unknown",
      costCredits: 0,
      costCogs: 0,
      customData: Object.keys(customData).length > 0 ? customData : undefined,
      createdAt: now,
      updatedAt: now,
    };
    await db.collection<Call>("calls").insertOne(call);

    log.info({ to: toNumber, did: did.providerNumber, providerCallId: handle.providerCallId, callId, name }, "manual dial placed");
    res.status(201).json({ ok: true, providerCallId: handle.providerCallId, callId, to: toNumber, from: did.providerNumber });
  } catch (err) {
    log.error({ err, to: toNumber }, "manual dial failed");
    res.status(502).json({ error: "dial failed at provider", detail: (err as Error).message });
  }
});

/**
 * GET /calls — paginated list of calls for the caller's tenant.
 *
 * Query params:
 *   - limit (default 50, max 200)
 *   - status (filter by Call.status)
 *   - direction ("in" | "out")
 *   - agentId
 *   - campaignId
 *   - before (ISO date) — return calls created strictly before this timestamp
 *
 * Newest first. Cursor pagination uses `before=<createdAt>` of the last
 * row in the previous page.
 */
callsRouter.get("/", async (req: Request, res: Response) => {
  const limit = Math.min(5000, Math.max(1, Number(req.query.limit ?? 50) || 50));
  const filter: Record<string, unknown> = {};
  for (const key of ["status", "direction", "agentId", "campaignId"] as const) {
    const v = req.query[key];
    if (typeof v === "string" && v.length > 0) filter[key] = v;
  }
  /* ── Date range filtering (from / to) ──────────────────────── */
  const fromDate = req.query.from;
  const toDate = req.query.to;
  const createdAtFilter: Record<string, unknown> = {};

  if (typeof fromDate === "string") {
    const parsed = new Date(fromDate);
    if (Number.isFinite(parsed.getTime())) {
      createdAtFilter.$gte = parsed;
    }
  }
  if (typeof toDate === "string") {
    const parsed = new Date(toDate);
    if (Number.isFinite(parsed.getTime())) {
      createdAtFilter.$lte = parsed;
    }
  }

  /* ── Cursor pagination (before) ──────────────────────────── */
  const before = req.query.before;
  if (typeof before === "string") {
    const parsed = new Date(before);
    if (Number.isFinite(parsed.getTime())) {
      createdAtFilter.$lt = parsed;
    }
  }

  if (Object.keys(createdAtFilter).length > 0) {
    filter.createdAt = createdAtFilter;
  }

  const list = await getDb()
    .collection<Call>("calls")
    .find(tenantScope(req, filter))
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();

  res.json({ calls: list });
});

callsRouter.get("/:id", async (req: Request, res: Response) => {
  const queryId = ObjectId.isValid(req.params.id)
    ? { $in: [req.params.id, new ObjectId(req.params.id)] }
    : req.params.id;

  const call = await getDb()
    .collection<Call>("calls")
    .findOne(tenantScope(req, { _id: queryId as any }));
  if (!call) {
    res.status(404).end();
    return;
  }
  const transcript = await getDb()
    .collection("transcripts")
    .findOne({ callId: queryId as any });

  res.json({
    ...call,
    transcript: transcript || null,
  });
});

/**
 * POST /calls/:id/analyze — re-trigger AI summary and sentiment analysis for a call.
 */
callsRouter.post("/:id/analyze", async (req: Request, res: Response) => {
  const queryId = ObjectId.isValid(req.params.id)
    ? { $in: [req.params.id, new ObjectId(req.params.id)] }
    : req.params.id;

  const db = getDb();
  const call = await db.collection<Call>("calls").findOne(tenantScope(req, { _id: queryId as any }));
  if (!call) {
    res.status(404).json({ error: "Call not found" });
    return;
  }

  const transcript = await db.collection("transcripts").findOne({ callId: queryId as any });
  if (!transcript || !Array.isArray(transcript.turns) || transcript.turns.length === 0) {
    res.status(400).json({ error: "No transcript turns available to analyze" });
    return;
  }

  const analysis = await analyzeCall(transcript.turns);

  await db.collection("transcripts").updateOne(
    tenantScope(req, { _id: transcript._id }),
    { $set: { summary: analysis.summary, updatedAt: new Date() } }
  );

  await db.collection<Call>("calls").updateOne(
    tenantScope(req, { _id: call._id }),
    { $set: { sentiment: analysis.sentiment, updatedAt: new Date() } }
  );

  log.info({ callId: call._id, sentiment: analysis.sentiment }, "Call manually re-analyzed via POST /calls/:id/analyze");

  res.json({
    ok: true,
    summary: analysis.summary,
    sentiment: analysis.sentiment,
  });
});

/**
 * POST /calls/kill — bulk or agent call kill endpoint.
 * Body: { callId?: string, agentId?: string }
 */
callsRouter.post("/kill", async (req: Request, res: Response) => {
  const { callId, agentId } = (req.body as { callId?: string; agentId?: string }) || {};
  const db = getDb();

  if (callId) {
    const queryId = ObjectId.isValid(callId)
      ? { $in: [callId, new ObjectId(callId)] }
      : callId;

    const call = await db.collection<Call>("calls").findOne(tenantScope(req, { _id: queryId as any }));
    if (!call) {
      res.status(404).json({ error: "Call not found" });
      return;
    }
    const killedInMemory = await killCallSession(call._id.toString(), "user_killed");
    const now = new Date();
    const durationSec = Math.max(1, Math.round((now.getTime() - new Date(call.createdAt).getTime()) / 1000));
    await db.collection<Call>("calls").updateOne(
      tenantScope(req, { _id: call._id }),
      {
        $set: {
          status: "completed",
          endedReason: "user_killed",
          durationSec: call.durationSec || durationSec,
          updatedAt: now,
        },
      }
    );
    log.info({ callId: call._id, killedInMemory }, "call killed via POST /calls/kill");
    res.json({ ok: true, callId: call._id, killedInMemory, count: 1, message: "Call terminated successfully" });
    return;
  }

  if (agentId) {
    const count = await killAgentCallSessions(agentId, req.tenantId ?? undefined, "user_killed");
    const now = new Date();
    await db.collection<Call>("calls").updateMany(
      tenantScope(req, { agentId, status: { $in: ["ringing", "inprogress", "queued"] } }),
      {
        $set: {
          status: "completed",
          endedReason: "user_killed",
          updatedAt: now,
        },
      }
    );
    log.info({ agentId, tenantId: req.tenantId, count }, "agent calls killed via POST /calls/kill");
    res.json({ ok: true, agentId, count, message: `Terminated ${count} active call(s) for agent` });
    return;
  }

  res.status(400).json({ error: "Must specify callId or agentId" });
});

/**
 * POST /calls/:id/kill — terminate specific call by id.
 */
callsRouter.post("/:id/kill", async (req: Request, res: Response) => {
  const callId = req.params.id;
  const db = getDb();

  const queryId = ObjectId.isValid(callId)
    ? { $in: [callId, new ObjectId(callId)] }
    : callId;

  const call = await db.collection<Call>("calls").findOne(tenantScope(req, { _id: queryId as any }));
  if (!call) {
    res.status(404).json({ error: "Call not found" });
    return;
  }

  const killedInMemory = await killCallSession(call._id.toString(), "user_killed");
  const now = new Date();
  const durationSec = Math.max(1, Math.round((now.getTime() - new Date(call.createdAt).getTime()) / 1000));

  await db.collection<Call>("calls").updateOne(
    tenantScope(req, { _id: call._id }),
    {
      $set: {
        status: "completed",
        endedReason: "user_killed",
        durationSec: call.durationSec || durationSec,
        updatedAt: now,
      },
    }
  );

  log.info({ callId: call._id, killedInMemory }, "call killed via POST /calls/:id/kill");
  res.json({ ok: true, callId: call._id, killedInMemory, message: "Call terminated successfully" });
});
