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
  running: { label: "Running", cls: "badge-green" },
  paused:  { label: "Paused",  cls: "badge-amber" },
  done:    { label: "Done",    cls: "badge-blue" },
};

export default async function CampaignsPage() {
  const campaigns = await fetchCampaigns();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Campaigns</h1>
          <p className="mt-1 text-sm text-[var(--c-text-secondary)]">
            {campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Link
          href="/campaigns/new"
          id="new-campaign-btn"
          className={buttonVariants({ className: "gap-2 font-semibold rounded-xl px-5 text-white" })}
          style={{
            background: "linear-gradient(135deg, oklch(0.55 0.28 275), oklch(0.50 0.25 240))",
            boxShadow: "0 4px 16px oklch(0.55 0.28 275 / 0.25)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Campaign
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 flex flex-col items-center text-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl icon-gradient-amber flex items-center justify-center"
            style={{ boxShadow: "0 8px 28px oklch(0.60 0.18 75 / 0.22)" }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Launch your first campaign</h3>
            <p className="text-sm text-[var(--c-text-secondary)] mt-1 max-w-xs">
              Upload a contact list, pick an AI agent, and start dialling at scale.
            </p>
          </div>
          <Link
            href="/campaigns/new"
            className={buttonVariants({ className: "mt-2 rounded-xl font-semibold text-white" })}
            style={{ background: "linear-gradient(135deg, oklch(0.55 0.28 275), oklch(0.50 0.25 240))" }}
          >
            Create campaign
          </Link>
        </div>
      ) : (
        <>
          <style>{`#campaigns-table tbody tr:hover { background: var(--c-row-hover); }`}</style>
          <div className="glass-card rounded-2xl overflow-hidden">
          <table className="w-full text-sm" id="campaigns-table">
            <thead>
              <tr className="border-b border-[var(--c-border)]" style={{ background: "var(--c-overlay-xs)" }}>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--c-text-dim)]">Name</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--c-text-dim)]">Status</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--c-text-dim)]">Progress</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--c-text-dim)]">From DID</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => {
                const cfg = STATUS_CONFIG[c.status];
                const pct =
                  c.stats.total > 0
                    ? Math.min(100, Math.round((c.stats.dialed / c.stats.total) * 100))
                    : 0;

                return (
                  <tr
                    key={c._id}
                    className="border-b border-[var(--c-border)] last:border-0 transition-colors duration-150"
                  >
                    <td className="px-5 py-4 font-medium text-foreground">{c.name}</td>
                    <td className="px-5 py-4">
                      <span className={`badge ${cfg.cls}`}>
                        {c.status === "running" && (
                          <span className="w-1.5 h-1.5 rounded-full bg-current inline-block animate-pulse" />
                        )}
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3 min-w-[140px]">
                        <div className="flex-1 h-1.5 rounded-full bg-[var(--c-overlay-md)] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${pct}%`,
                              background:
                                pct === 100
                                  ? "var(--accent-green)"
                                  : "linear-gradient(90deg, oklch(0.55 0.28 275), oklch(0.52 0.22 220))",
                            }}
                          />
                        </div>
                        <span className="text-xs text-[var(--c-text-secondary)] whitespace-nowrap">
                          {c.stats.dialed}/{c.stats.total}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-[var(--c-text-secondary)]">
                      {c.fromDid ?? "—"}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/campaigns/${c._id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--brand)] hover:opacity-80 transition-smooth"
                      >
                        Open
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
        </>
      )}
    </div>
  );
}
