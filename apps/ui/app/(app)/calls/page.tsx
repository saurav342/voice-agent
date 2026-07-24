import type { Call } from "@voiceplatform/shared";

import { api, ApiError } from "@/lib/api";
import { CallsTable } from "./calls-table";

async function fetchCalls(): Promise<Call[]> {
  try {
    const { calls } = await api.get<{ calls: Call[] }>("/calls?limit=2000");
    return calls;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
}

export default async function CallsPage() {
  const calls = await fetchCalls();

  const totalDuration = calls.reduce((acc, c) => acc + (c.durationSec || 0), 0);
  const totalMinutes = Math.round(totalDuration / 60);

  return (
    <div className="space-y-8">
      {/* Top Header & Summary Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 glass-card p-6 rounded-3xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge badge-emerald text-[11px] font-bold">
              Call Log Registry
            </span>
            <span className="text-xs text-[var(--c-text-dim)] font-medium">
              {calls.length} session{calls.length !== 1 ? "s" : ""} recorded ({totalMinutes} mins total)
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground mt-1">
            Voice Call Logs
          </h1>
          <p className="mt-1 text-sm text-[var(--c-text-secondary)]">
            Explore conversation audio recordings, automated transcripts, sentiment analysis, and call telemetry.
          </p>
        </div>
      </div>

      {calls.length === 0 ? (
        <div className="glass-card rounded-3xl p-16 flex flex-col items-center text-center gap-5 border border-dashed border-[var(--c-border)]">
          <div
            className="w-20 h-20 rounded-3xl icon-gradient-green flex items-center justify-center mx-auto shadow-xl"
            style={{ boxShadow: "0 10px 30px oklch(0.52 0.18 158 / 0.30)" }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z"/>
            </svg>
          </div>
          <div className="space-y-1 max-w-sm">
            <h3 className="text-xl font-extrabold text-foreground">No call records found</h3>
            <p className="text-xs text-[var(--c-text-secondary)] leading-relaxed">
              Use the Quick Dial on the Dashboard or start an outbound Campaign to make your first AI call.
            </p>
          </div>
        </div>
      ) : (
        <CallsTable initialCalls={calls} />
      )}
    </div>
  );
}

