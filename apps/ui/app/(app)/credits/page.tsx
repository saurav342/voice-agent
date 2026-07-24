import type { CreditsLedgerEntry } from "@voiceplatform/shared";

import { api, ApiError } from "@/lib/api";

interface LedgerPage {
  balance: number;
  entries: CreditsLedgerEntry[];
}

async function fetchLedger(): Promise<LedgerPage> {
  try {
    return await api.get<LedgerPage>("/credits?limit=100");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return { balance: 0, entries: [] };
    }
    throw err;
  }
}

const TYPE_CLASSES: Record<CreditsLedgerEntry["type"], string> = {
  topup: "badge-emerald",
  refund: "badge-blue",
  call: "badge-muted",
  adjustment: "badge-amber",
};

export default async function CreditsPage() {
  const { balance, entries } = await fetchLedger();

  const creditsPct = Math.min(100, (balance / 10000) * 100);

  return (
    <div className="space-y-8">
      {/* Top Header & Balance Hero */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 glass-card p-6 rounded-3xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge badge-emerald text-[11px] font-bold">
              Account Ledger & Billing
            </span>
            <span className="text-xs text-[var(--c-text-dim)] font-medium">
              1 Credit ≈ 1 Second Talk Time
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground mt-1">
            Credits & Billing
          </h1>
          <p className="mt-1 text-sm text-[var(--c-text-secondary)]">
            Monitor real-time credit consumption across inbound and outbound voice calls.
          </p>
        </div>
      </div>

      {/* Balance Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Balance Card */}
        <div className="md:col-span-2 glass-card p-6 rounded-3xl space-y-5 relative overflow-hidden border border-[var(--c-border)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--c-text-dim)]">
              Current Available Balance
            </span>
            <span className="badge badge-emerald text-[10px] font-bold">
              Active Tier
            </span>
          </div>

          <div className="flex items-baseline gap-3">
            <span
              className={`text-5xl font-black tracking-tight ${
                balance < 0 ? "text-[var(--accent-red)]" : "text-foreground"
              }`}
            >
              {balance.toLocaleString()}
            </span>
            <span className="text-sm font-semibold text-[var(--c-text-secondary)]">
              Credits Remaining
            </span>
          </div>

          {/* Meter */}
          <div className="space-y-2">
            <div className="h-3 rounded-full bg-[var(--c-overlay-md)] overflow-hidden p-0.5 border border-[var(--c-border)]">
              <div
                className="h-full rounded-full transition-all duration-500 shadow-sm"
                style={{
                  width: `${creditsPct}%`,
                  background:
                    creditsPct > 50
                      ? "linear-gradient(90deg, oklch(0.42 0.14 158), oklch(0.68 0.12 155))"
                      : creditsPct > 20
                        ? "linear-gradient(90deg, oklch(0.60 0.18 75), oklch(0.65 0.16 60))"
                        : "linear-gradient(90deg, oklch(0.52 0.22 24), oklch(0.60 0.20 15))",
                }}
              />
            </div>
            <div className="flex items-center justify-between text-xs font-medium text-[var(--c-text-dim)]">
              <span>0 Credits</span>
              <span>{creditsPct.toFixed(0)}% Capacity</span>
              <span>10,000 Credits Cap</span>
            </div>
          </div>
        </div>

        {/* Top-up Card */}
        <div className="glass-card p-6 rounded-3xl space-y-4 border border-[var(--c-border)] flex flex-col justify-between">
          <div className="space-y-2">
            <span className="badge badge-amber text-[10px] font-bold">
              Auto Top-Up Info
            </span>
            <h3 className="text-lg font-bold text-foreground">Need More Credits?</h3>
            <p className="text-xs text-[var(--c-text-secondary)] leading-relaxed">
              Top-ups are processed instantly by your dedicated account manager. Self-serve payment gateway integrations will land in Stream S2.
            </p>
          </div>
          <button
            className="w-full py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:scale-[1.02]"
            style={{
              background: "linear-gradient(135deg, oklch(0.42 0.14 158), oklch(0.55 0.16 155))",
              boxShadow: "0 4px 16px oklch(0.42 0.14 158 / 0.25)",
            }}
          >
            Request Credit Top-up
          </button>
        </div>
      </div>

      {/* Recent Activity Ledger */}
      <div className="glass-card rounded-3xl overflow-hidden border border-[var(--c-border)] shadow-lg">
        <div className="px-6 py-5 border-b border-[var(--c-border)] bg-[var(--c-overlay-xs)] flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-foreground">Transaction Activity Ledger</h3>
            <p className="text-xs text-[var(--c-text-secondary)] mt-0.5">
              Historical ledger of top-ups, refunds, call deductions, and manual adjustments.
            </p>
          </div>
          <span className="text-xs text-[var(--c-text-dim)] font-mono font-medium">
            {entries.length} Entries
          </span>
        </div>

        {entries.length === 0 ? (
          <div className="p-12 text-center text-sm text-[var(--c-text-secondary)]">
            No ledger entries recorded yet. Activity will appear as calls complete or top-ups land.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-bold uppercase tracking-wider text-[var(--c-text-dim)] border-b border-[var(--c-border)]">
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Transaction Type</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-right">Balance After</th>
                <th className="px-6 py-4">Description / Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--c-border)]">
              {entries.map((e) => (
                <tr key={e._id} className="hover:bg-[var(--c-row-hover)] transition-colors">
                  <td className="px-6 py-4 text-xs font-medium text-foreground whitespace-nowrap">
                    {new Date(e.createdAt).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`badge ${TYPE_CLASSES[e.type] ?? "badge-muted"} capitalize`}>
                      {e.type}
                    </span>
                  </td>
                  <td
                    className={`px-6 py-4 text-right font-mono font-bold text-xs ${
                      e.amount < 0 ? "text-[var(--accent-red)]" : "text-[var(--accent-green)]"
                    }`}
                  >
                    {e.amount > 0 ? "+" : ""}
                    {e.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-semibold text-xs text-foreground">
                    {e.balanceAfter.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-xs text-[var(--c-text-secondary)]">
                    {e.note ?? (e.callId ? `Call ID: ${e.callId.slice(0, 8)}…` : "—")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

