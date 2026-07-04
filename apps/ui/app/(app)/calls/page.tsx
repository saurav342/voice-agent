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

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Calls</h1>
          <p className="mt-1 text-sm text-[var(--c-text-secondary)]">
            {calls.length > 0 ? `${calls.length} calls loaded · Use filters to narrow down` : "No calls recorded yet"}
          </p>
        </div>

        {calls.length === 0 ? (
          <div className="glass-card rounded-2xl p-16 flex flex-col items-center text-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl icon-gradient-green flex items-center justify-center"
              style={{ boxShadow: "0 8px 28px oklch(0.52 0.18 158 / 0.22)" }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">No calls yet</h3>
              <p className="text-sm text-[var(--c-text-secondary)] mt-1 max-w-xs">
                Start a campaign or use the Quick Dial on the dashboard to initiate your first call.
              </p>
            </div>
          </div>
        ) : (
          <CallsTable initialCalls={calls} />
        )}
      </div>
    </>
  );
}
