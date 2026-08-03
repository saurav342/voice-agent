import { ObjectId, type Collection } from "mongodb";

import type {
  Call,
  Campaign,
  CampaignNumber,
  Did,
} from "@voiceplatform/shared";

import type { TelephonyProvider } from "../adapters/telephony/types.js";
import { createLogger } from "../lib/logger.js";

const log = createLogger("campaign-runner");

export interface DialNextLeadDeps {
  telephony: TelephonyProvider;
  campaigns: Collection<Campaign>;
  calls: Collection<Call>;
  dids: Collection<Did>;
  /**
   * Base WS URL (e.g. `wss://api.auto4you.in`). Passed per call so the
   * telephony provider streams audio to the right place. Tests pass a
   * dummy; prod reads from `WS_BASE_URL` env at the worker setup.
   */
  wsBaseUrl?: string;
  /** Override for tests — default is `new Date()` and `new ObjectId()`. */
  now?: () => Date;
  newId?: () => string;
}

export interface DialNextLeadResult {
  /** "dialed" — one number was originated. Cursor advanced. */
  status: "dialed" | "no-more-leads" | "paused" | "no-did";
  campaign: Campaign;
  call?: Call;
}

/**
 * Pure-ish unit that drains one lead from a campaign. Caller is
 * responsible for *when* to invoke this (pacing lives in the BullMQ
 * worker; tests call it inline). Wrapped in atomicity by checking the
 * campaign status + cursor before each originate.
 */
export async function dialNextLead(
  campaignId: string,
  tenantId: string,
  deps: DialNextLeadDeps,
): Promise<DialNextLeadResult> {
  const now = deps.now ?? (() => new Date());
  const newId = deps.newId ?? (() => new ObjectId().toString());

  const campaign = await deps.campaigns.findOne({ _id: campaignId, tenantId });
  if (!campaign) {
    throw new Error(`campaign ${campaignId} not found for tenant ${tenantId}`);
  }
  if (campaign.status !== "running") {
    return { status: "paused", campaign };
  }

  // RBI Compliance Check for Outbound Campaigns (8 AM - 7 PM IST window)
  if (process.env.BYPASS_COMPLIANCE_HOURS !== "true") {
    const nowIST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const hour = nowIST.getHours();
    if (hour < 8 || hour >= 19) {
      log.warn({ campaignId, hour }, "Campaign dialer paused: outside RBI permitted hours (8 AM - 7 PM IST)");
      return { status: "paused", campaign };
    }
  }

  if (!campaign.fromDid) {
    return { status: "no-did", campaign };
  }
  if (campaign.cursor >= campaign.numbers.length) {
    // Drained — mark done so future ticks no-op fast.
    const updated = await deps.campaigns.findOneAndUpdate(
      { _id: campaignId, tenantId, status: "running" },
      { $set: { status: "done", updatedAt: now() } },
      { returnDocument: "after" },
    );
    return { status: "no-more-leads", campaign: updated ?? campaign };
  }

  // Reserve cursor + count BEFORE the originate so a race never
  // double-dials the same lead. Using returnDocument: "before" guarantees
  // atomic ownership of targetIndex even during concurrent parallel calls.
  const reserved = await deps.campaigns.findOneAndUpdate(
    {
      _id: campaignId,
      tenantId,
      status: "running",
      cursor: { $lt: campaign.numbers.length },
    },
    {
      $inc: { cursor: 1, "stats.dialed": 1 },
      $set: { updatedAt: now() },
    },
    { returnDocument: "before" },
  );

  if (!reserved) {
    const current = await deps.campaigns.findOne({ _id: campaignId, tenantId });
    if (current?.status !== "running") {
      return { status: "paused", campaign: current ?? campaign };
    }
    return { status: "no-more-leads", campaign: current ?? campaign };
  }

  const targetIndex = reserved.cursor;
  const target = reserved.numbers[targetIndex] as CampaignNumber;
  if (!target) {
    return { status: "no-more-leads", campaign: reserved };
  }

  const callId = newId();

  // Per-call WS URL so Voicelink streams audio to /ws/voicelink/<didId>
  // with our callId in the query. Looking up the DID row is O(1) on the
  // (providerNumber, tenantId) compound index.
  const did = await deps.dids.findOne({
    providerNumber: campaign.fromDid,
    tenantId,
  });
  let websocketUrl: string | undefined;
  if (did && deps.wsBaseUrl) {
    websocketUrl = `${deps.wsBaseUrl}/ws/voicelink/${did._id}?callId=${callId}`;
  } else if (!did) {
    log.warn(
      { fromDid: campaign.fromDid, tenantId },
      "originate without registered DID row — audio path will not connect",
    );
  }

  let handle;
  try {
    handle = await deps.telephony.originateCall({
      fromDid: campaign.fromDid,
      toNumber: target.phone,
      websocketUrl,
      customParameters: JSON.stringify({
        callId,
        campaignId,
        agentId: campaign.agentId,
        tenantId,
      }),
    });
  } catch (err) {
    log.warn({ err, callId, campaignId, toNumber: target.phone }, "originate failed");
    await deps.campaigns.updateOne(
      { _id: campaignId, tenantId },
      { $inc: { "stats.failed": 1 } },
    );
    const failed: Call = {
      _id: callId,
      tenantId,
      agentId: campaign.agentId,
      campaignId,
      direction: "out",
      providerCallId: "",
      fromNumber: campaign.fromDid,
      toNumber: target.phone,
      durationSec: 0,
      status: "failed",
      sentiment: "unknown",
      outcomeTag: "UNKNOWN",
      costCredits: 0,
      costCogs: 0,
      createdAt: now(),
      updatedAt: now(),
    };
    await deps.calls.insertOne(failed);
    return { status: "dialed", campaign, call: failed };
  }

  const call: Call = {
    _id: callId,
    tenantId,
    agentId: campaign.agentId,
    campaignId,
    direction: "out",
    providerCallId: handle.providerCallId,
    fromNumber: campaign.fromDid,
    toNumber: target.phone,
    startedAt: handle.acceptedAt,
    durationSec: 0,
    status: "ringing",
    sentiment: "unknown",
    outcomeTag: "UNKNOWN",
    costCredits: 0,
    costCogs: 0,
    createdAt: now(),
    updatedAt: now(),
  };
  await deps.calls.insertOne(call);

  const after = await deps.campaigns.findOne({ _id: campaignId, tenantId });
  return { status: "dialed", campaign: after ?? campaign, call };
}

/** Compute the per-call delay (ms) given a pacing target. */
export function pacingIntervalMs(callsPerMinute: number): number {
  if (callsPerMinute <= 0) return 60_000;
  return Math.floor(60_000 / callsPerMinute);
}

/**
 * Drains up to `count` leads from a campaign concurrently in parallel.
 */
export async function dialBatchLeads(
  campaignId: string,
  tenantId: string,
  deps: DialNextLeadDeps,
  count = 1,
): Promise<DialNextLeadResult[]> {
  const batchSize = Math.max(1, count);
  const tasks = Array.from({ length: batchSize }).map(() =>
    dialNextLead(campaignId, tenantId, deps),
  );
  return Promise.all(tasks);
}

