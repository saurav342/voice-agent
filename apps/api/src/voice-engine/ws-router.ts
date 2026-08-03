import type { Server as HTTPServer, IncomingMessage } from "node:http";
import type { Duplex } from "node:stream";

import { WebSocketServer, type WebSocket } from "ws";
import { ObjectId } from "mongodb";

import { denormalizeProviderCallId, type Agent, type Call, type Did, type Campaign } from "@voiceplatform/shared";

import { getDb } from "../db/connection.js";
import { createLogger } from "../lib/logger.js";
import { realtimeForAgent } from "./realtime-factory.js";
import { CallSession, type StartFrameInfo } from "./session-manager.js";

const log = createLogger("ws-router");

const VOICELINK_PATH = /^\/ws\/voicelink\/([a-zA-Z0-9_-]+)$/;

export interface MountOptions {
  /** Override for tests — by default the router uses realtimeForAgent. */
  realtimeFactory?: (agent: Agent) => ReturnType<typeof realtimeForAgent>;
  /** Override for tests — by default the router uses the global Mongo db. */
  db?: ReturnType<typeof getDb>;
}

/**
 * Attach a WS upgrade handler to the given HTTP server. Voicelink (and
 * any future telephony provider that registers a per-DID WS bot) opens
 * a socket at:
 *
 *   wss://api.auto4you.in/ws/voicelink/<didId>[?callId=<our-call-id>]
 *
 * Routing rules:
 *   1. Path must match /ws/voicelink/:didId. Anything else → socket
 *      destroyed before upgrade.
 *   2. The DID must exist in our `dids` collection. If not, destroyed
 *      (a stale bot URL Voicelink kept after we revoked the link).
 *   3. Outbound path (callId query param present): we look up the
 *      pre-created call row to get tenantId + agentId. Provider boots
 *      immediately because identity is already known.
 *   4. Inbound path (no callId): we accept the upgrade with the DID's
 *      defaultAgentId, and wait for the {event:"start"} frame to learn
 *      the providerCallId. If defaultAgentId is missing, we close —
 *      admin needs to set one before inbound calls can land.
 *
 * The returned `WebSocketServer` is exposed for tests that want to
 * inspect connection state. Production code should not need it.
 */
export function mountCallWsRouter(
  server: HTTPServer,
  opts: MountOptions = {},
): WebSocketServer {
  const factory = opts.realtimeFactory ?? realtimeForAgent;
  const db = () => opts.db ?? getDb();
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", async (req: IncomingMessage, socket: Duplex, head: Buffer) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    const m = VOICELINK_PATH.exec(url.pathname);
    if (!m) {
      log.warn({ path: url.pathname }, "rejected upgrade: bad path");
      socket.destroy();
      return;
    }
    const didId = m[1]!;
    const callIdParam = url.searchParams.get("callId");

    try {
      const did = await db().collection<Did>("dids").findOne({ _id: didId });
      if (!did) {
        log.warn({ didId }, "rejected upgrade: unknown DID");
        socket.destroy();
        return;
      }

      // Resolve initial agent. Outbound path has the call already
      // inserted (campaign-engine / place-call pre-creates it); inbound falls back
      // to the DID's default.
      let agentId = did.defaultAgentId;
      let callId = callIdParam ?? undefined;
      let customParameters: Record<string, string> = {};

      let callDoc: Call | null = null;
      if (callIdParam) {
        callDoc = await db()
          .collection<Call>("calls")
          .findOne({ _id: callIdParam });
      }

      if (!callDoc) {
        // VoiceLink or proxies may strip query params on WS upgrade.
        // Fall back to looking up the most recent pending/ringing outbound call for this DID within last 3 mins.
        const recentCutoff = new Date(Date.now() - 3 * 60 * 1000);
        callDoc = await db()
          .collection<Call>("calls")
          .findOne(
            {
              fromNumber: did.providerNumber,
              tenantId: did.tenantId,
              direction: "out",
              status: { $in: ["ringing", "queued"] },
              createdAt: { $gte: recentCutoff },
            },
            { sort: { createdAt: -1 } }
          );
      }

      if (callDoc && callDoc.tenantId === did.tenantId) {
        agentId = callDoc.agentId;
        callId = callDoc._id.toString();
        customParameters.phone = callDoc.toNumber;
        customParameters.to = callDoc.toNumber;
        customParameters.from = callDoc.fromNumber;

        if (callDoc.campaignId) {
          const campaign = await db()
            .collection<Campaign>("campaigns")
            .findOne({ _id: callDoc.campaignId, tenantId: did.tenantId });
          if (campaign) {
            const numberEntry = campaign.numbers.find(
              (n: { phone: string }) => n.phone === callDoc!.toNumber
            );
            if (numberEntry && numberEntry.customData) {
              for (const [k, v] of Object.entries(numberEntry.customData)) {
                customParameters[k] = String(v);
              }
            }
          }
        }

        if (callDoc.customData) {
          for (const [k, v] of Object.entries(callDoc.customData)) {
            customParameters[k] = String(v);
          }
        }
      } else if (callIdParam) {
        log.warn(
          { callId: callIdParam, didId },
          "outbound upgrade with unknown/cross-tenant callId — using DID default",
        );
      }

      if (!agentId) {
        log.warn({ didId }, "rejected upgrade: no agent (inbound with no defaultAgentId)");
        socket.destroy();
        return;
      }

      const agent = await db()
        .collection<Agent>("agents")
        .findOne({ _id: agentId, tenantId: did.tenantId });
      if (!agent) {
        log.warn({ agentId, tenantId: did.tenantId }, "rejected upgrade: agent missing");
        socket.destroy();
        return;
      }

      // Synthetic callId for inbound until the start frame arrives — it
      // gets overwritten by the real providerCallId in onStartFrame.
      if (!callId) callId = new ObjectId().toString();

      wss.handleUpgrade(req, socket, head, (ws: WebSocket) => {
        startSession({
          ws,
          did,
          agent,
          callId: callId!,
          factory,
          waitForStartFrame: !callIdParam,
          customParameters,
        });
      });
    } catch (err) {
      log.error({ err, didId }, "upgrade failed");
      socket.destroy();
    }
  });

  return wss;
}

function startSession(args: {
  ws: WebSocket;
  did: Did;
  agent: Agent;
  callId: string;
  factory: (agent: Agent) => ReturnType<typeof realtimeForAgent>;
  waitForStartFrame: boolean;
  customParameters?: Record<string, string>;
}): void {
  const { ws, did, agent, callId, factory, waitForStartFrame, customParameters } = args;

  let provider;
  try {
    provider = factory(agent);
  } catch (err) {
    log.error(
      { err, agentId: agent._id, tenantId: did.tenantId },
      "realtime factory failed — closing socket",
    );
    ws.close(1011, "realtime provider init failed");
    return;
  }

  const onStartFrame = async (info: StartFrameInfo): Promise<void> => {
    // Inbound: backfill providerCallId so the webhook receiver's upsert
    // matches the row we (will) create here. Outbound: confirm the
    // providerCallId Voicelink reports matches what we expect.
    if (!info.providerCallId) return;
    try {
      const cleanId = denormalizeProviderCallId(info.providerCallId);
      const db = getDb();
      const existingCall = await db
        .collection<Call>("calls")
        .findOne({ providerCallId: cleanId });

      if (existingCall) {
        log.info(
          { callId, existingCallId: existingCall._id, providerCallId: cleanId },
          "Reconciled WebSocket session with existing outbound call record",
        );
        session.updateCallId(existingCall._id.toString());
        await db.collection<Call>("calls").updateOne(
          { _id: existingCall._id },
          { $set: { status: "inprogress", updatedAt: new Date() } }
        );
      } else {
        await db
          .collection<Call>("calls")
          .updateOne(
            { _id: callId },
            {
              $set: {
                providerCallId: cleanId,
                status: "inprogress",
                updatedAt: new Date(),
              },
              $setOnInsert: {
                _id: callId,
                tenantId: did.tenantId,
                agentId: agent._id,
                direction: "in",
                fromNumber: info.customParameters?.from ?? "unknown",
                toNumber: did.providerNumber,
                durationSec: 0,
                sentiment: "unknown",
                costCredits: 0,
                costCogs: 0,
                createdAt: new Date(),
              },
            },
            { upsert: true },
          );
      }
    } catch (err) {
      log.warn({ err, callId }, "failed to backfill call row from start frame");
    }
  };

  // Voicelink (Twilio-compatible) carries µ-law 8 kHz on the WS;
  // OpenAI Realtime + Gemini Live both speak PCM16 24 kHz. The session
  // bridges between the two unless we're using the fake provider in
  // tests (which round-trips bytes for echo).
  const audioFormat: "passthrough" | "mulaw8k-pcm16_24k" =
    process.env.REALTIME_MODE === "fake" ? "passthrough" : "mulaw8k-pcm16_24k";

  const session = new CallSession(ws, {
    callId,
    tenantId: did.tenantId,
    agentId: agent._id,
    provider,
    systemPrompt: agent.prompt,
    greeting: agent.greeting,
    endCallTriggers: agent.endCallTriggers,
    waitForStartFrame,
    onStartFrame,
    audioFormat,
    customParameters,
  });

  session.start().catch((err) => {
    log.error({ err, callId }, "session start failed");
    ws.close(1011, "session start failed");
  });

  log.info(
    {
      callId,
      didId: did._id,
      tenantId: did.tenantId,
      agentId: agent._id,
      direction: waitForStartFrame ? "in" : "out",
    },
    "call session started",
  );
}
