import Link from "next/link";
import type { Campaign } from "@voiceplatform/shared";

import { api, ApiError } from "@/lib/api";
import { buttonVariants } from "@/components/ui/button";

async function fetchCampaigns(): Promise<Campaign[]> {
  try {
    const { campaigns } = await api.get<{ campaigns: Campaign[] }>("/campaigns");
    return campaigns;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
}

const STATUS_CONFIG: Record<Campaign["status"], { label: string; cls: string }> = {
  draft:   { label: "Draft",   cls: "badge-muted" },
  running: { label: "Running", cls: "badge-emerald" },
  paused:  { label: "Paused",  cls: "badge-amber" },
  done:    { label: "Done",    cls: "badge-blue" },
};

export default async function CampaignsPage() {
  const campaigns = await fetchCampaigns();

  const runningCount = campaigns.filter((c) => c.status === "running").length;
  const doneCount = campaigns.filter((c) => c.status === "done").length;

  return (
    <div className="space-y-8">
      {/* Top Header & Summary Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 glass-card p-6 rounded-3xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge badge-emerald text-[11px] font-bold">
              Outbound Engine
            </span>
            <span className="text-xs text-[var(--c-text-dim)] font-medium">
              {runningCount} active • {doneCount} completed
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground mt-1">
            Campaigns
          </h1>
          <p className="mt-1 text-sm text-[var(--c-text-secondary)]">
            Batch dial contacts automatically with AI agents and monitor real-time completion progress.
          </p>
        </div>

        <Link
          href="/campaigns/new"
          id="new-campaign-btn"
          className={buttonVariants({ className: "gap-2 font-bold rounded-xl px-5 text-white shadow-lg hover:scale-105 transition-all shrink-0" })}
          style={{
            background: "linear-gradient(135deg, oklch(0.42 0.14 158), oklch(0.55 0.16 155))",
            boxShadow: "0 4px 16px oklch(0.42 0.14 158 / 0.28)",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Campaign
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="glass-card rounded-3xl p-16 flex flex-col items-center text-center gap-5 border border-dashed border-[var(--c-border)]">
          <div
            className="w-20 h-20 rounded-3xl icon-gradient-amber flex items-center justify-center mx-auto shadow-xl"
            style={{ boxShadow: "0 10px 30px oklch(0.60 0.18 75 / 0.30)" }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          <div className="space-y-1 max-w-sm">
            <h3 className="text-xl font-extrabold text-foreground">Launch your first campaign</h3>
            <p className="text-xs text-[var(--c-text-secondary)] leading-relaxed">
              Upload a contact CSV list, select an AI agent, assign a DID phone number, and begin automated calling.
            </p>
          </div>
          <Link
            href="/campaigns/new"
            className={buttonVariants({ className: "mt-2 rounded-xl font-bold px-6 text-white hover:scale-105 transition-transform" })}
            style={{
              background: "linear-gradient(135deg, oklch(0.42 0.14 158), oklch(0.55 0.16 155))",
              boxShadow: "0 4px 16px oklch(0.42 0.14 158 / 0.25)",
            }}
          >
            Create campaign
          </Link>
        </div>
      ) : (
        <div className="glass-card rounded-3xl overflow-hidden shadow-lg border border-[var(--c-border)]">
          <table className="w-full text-sm" id="campaigns-table">
            <thead>
              <tr className="border-b border-[var(--c-border)] bg-[var(--c-overlay-xs)]">
                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--c-text-dim)]">Campaign Name</th>
                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--c-text-dim)]">Status</th>
                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--c-text-dim)]">Progress</th>
                <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wider text-[var(--c-text-dim)]">Origin DID</th>
                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-[var(--c-text-dim)]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--c-border)]">
              {campaigns.map((c) => {
                const cfg = STATUS_CONFIG[c.status];
                const pct =
                  c.stats.total > 0
                    ? Math.min(100, Math.round((c.stats.dialed / c.stats.total) * 100))
                    : 0;

                return (
                  <tr
                    key={c._id}
                    className="hover:bg-[var(--c-row-hover)] transition-colors duration-150 group"
                  >
                    <td className="px-6 py-4 font-bold text-foreground group-hover:text-[var(--brand)] transition-colors">
                      {c.name}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge ${cfg.cls}`}>
                        {c.status === "running" && (
                          <span className="w-1.5 h-1.5 rounded-full bg-current inline-block animate-pulse" />
                        )}
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4 min-w-[180px]">
                        <div className="flex-1 h-2 rounded-full bg-[var(--c-overlay-md)] overflow-hidden p-0.5 border border-[var(--c-border)]">
                          <div
                            className="h-full rounded-full transition-all duration-500 shadow-xs"
                            style={{
                              width: `${pct}%`,
                              background:
                                pct === 100
                                  ? "var(--accent-green)"
                                  : "linear-gradient(90deg, oklch(0.42 0.14 158), oklch(0.68 0.12 155))",
                            }}
                          />
                        </div>
                        <span className="text-xs font-mono font-semibold text-[var(--c-text-secondary)] whitespace-nowrap">
                          {c.stats.dialed}/{c.stats.total} ({pct}%)
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-[var(--c-text-secondary)]">
                      {c.fromDid ? (
                        <span className="px-2.5 py-1 rounded-lg bg-[var(--c-overlay-sm)] border border-[var(--c-border)]">
                          {c.fromDid}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/campaigns/${c._id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--brand)] hover:underline transition-all group-hover:gap-2"
                      >
                        Open Details
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

