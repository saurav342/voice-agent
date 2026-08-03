import { z } from "zod";

export const CallDirection = z.enum(["in", "out"]);
export const CallStatus = z.enum([
  "queued",
  "ringing",
  "inprogress",
  "completed",
  "failed",
]);
export const Sentiment = z.enum(["positive", "neutral", "negative", "unknown"]);
export const OutcomeTag = z.enum([
  "PAID_CONFIRMED",
  "PROMISE_TO_PAY",
  "DISPUTED",
  "HARDSHIP",
  "NO_ANSWER",
  "OPT_OUT",
  "WRONG_NUMBER",
  "CALLBACK_REQUESTED",
  "UNKNOWN",
]);

export const Call = z.object({
  _id: z.string(),
  tenantId: z.string(),
  agentId: z.string(),
  campaignId: z.string().optional(),
  direction: CallDirection,
  providerCallId: z.string(),
  fromNumber: z.string(),
  toNumber: z.string(),
  startedAt: z.coerce.date().optional(),
  endedAt: z.coerce.date().optional(),
  durationSec: z.number().nonnegative().default(0),
  status: CallStatus.default("queued"),
  recordingUrl: z.string().url().optional(),
  transcriptId: z.string().optional(),
  sentiment: Sentiment.default("unknown"),
  outcomeTag: OutcomeTag.default("UNKNOWN"),
  costCredits: z.number().nonnegative().default(0),
  costCogs: z.number().nonnegative().default(0),
  customData: z.record(z.string()).optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type CallDirection = z.infer<typeof CallDirection>;
export type CallStatus = z.infer<typeof CallStatus>;
export type Sentiment = z.infer<typeof Sentiment>;
export type OutcomeTag = z.infer<typeof OutcomeTag>;
export type Call = z.infer<typeof Call>;

export function denormalizeProviderCallId(id: string): string {
  // Strip "call_" prefix if present
  let clean = id.startsWith("call_") ? id.slice(5) : id;
  // If clean is a 32-character hex string (UUID without hyphens)
  if (/^[0-9a-fA-F]{32}$/.test(clean)) {
    // Reconstruct UUID format: 8-4-4-4-12
    return `${clean.slice(0, 8)}-${clean.slice(8, 12)}-${clean.slice(12, 16)}-${clean.slice(16, 20)}-${clean.slice(20)}`.toLowerCase();
  }
  return clean;
}

