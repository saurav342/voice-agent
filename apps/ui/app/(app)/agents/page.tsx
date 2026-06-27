import Link from "next/link";

import type { Agent } from "@voiceplatform/shared";

import { api, ApiError } from "@/lib/api";
import { buttonVariants } from "@/components/ui/button";

async function fetchAgents(): Promise<Agent[]> {
  try {
    const { agents } = await api.get<{ agents: Agent[] }>("/agents");
    return agents;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
}

const STATUS_CONFIG = {
  active:   { label: "Active",   cls: "badge-green" },
  inactive: { label: "Inactive", cls: "badge-muted" },
  draft:    { label: "Draft",    cls: "badge-muted" },
} as const;

function getInitials(name: string): string {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

const AVATAR_GRADIENTS = [
  "icon-gradient-violet",
  "icon-gradient-green",
  "icon-gradient-amber",
  "icon-gradient-blue",
];

export default async function AgentsPage() {
  const agents = await fetchAgents();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Agents</h1>
          <p className="mt-1 text-sm text-[var(--c-text-secondary)]">
            {agents.length} voice agent{agents.length !== 1 ? "s" : ""} configured
          </p>
        </div>
        <Link
          href="/agents/new"
          id="new-agent-btn"
          className={buttonVariants({ className: "gap-2 font-semibold rounded-xl px-5 text-white" })}
          style={{
            background: "linear-gradient(135deg, oklch(0.55 0.28 275), oklch(0.50 0.25 240))",
            boxShadow: "0 4px 16px oklch(0.55 0.28 275 / 0.25)",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Agent
        </Link>
      </div>

      {agents.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-2xl icon-gradient-violet flex items-center justify-center mx-auto"
               style={{ boxShadow: "0 8px 28px oklch(0.55 0.28 275 / 0.22)" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="8" r="4"/>
              <path d="M6 20v-1a6 6 0 0112 0v1"/>
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">No agents yet</h3>
            <p className="text-sm text-[var(--c-text-secondary)] mt-1 max-w-xs">
              Create your first AI voice agent to start handling inbound and outbound calls.
            </p>
          </div>
          <Link
            href="/agents/new"
            className={buttonVariants({ className: "mt-2 rounded-xl font-semibold text-white" })}
            style={{ background: "linear-gradient(135deg, oklch(0.55 0.28 275), oklch(0.50 0.25 240))" }}
          >
            Create your first agent
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent, i) => {
            const statusCfg =
              STATUS_CONFIG[agent.status as keyof typeof STATUS_CONFIG] ??
              { label: agent.status, cls: "badge-muted" };

            return (
              <div
                key={agent._id}
                className="glass-card rounded-2xl p-5 flex flex-col gap-4 transition-smooth hover:shadow-lg group"
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`w-12 h-12 rounded-2xl ${AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length]} flex items-center justify-center text-white font-bold text-sm shrink-0 transition-smooth group-hover:scale-105`}
                  >
                    {getInitials(agent.name)}
                  </div>
                  <span className={`badge ${statusCfg.cls}`}>
                    {statusCfg.label === "Active" && (
                      <span className="w-1.5 h-1.5 rounded-full bg-current inline-block animate-pulse" />
                    )}
                    {statusCfg.label}
                  </span>
                </div>

                <h3 className="font-semibold text-base leading-tight text-foreground">{agent.name}</h3>

                <div className="flex flex-wrap gap-1.5">
                  {[
                    { icon: "mic", label: agent.voice.provider },
                    { icon: "grid", label: agent.llm.realtimeModel },
                    ...(agent.voice.providerVoiceId ? [{ icon: null, label: agent.voice.providerVoiceId }] : []),
                  ].map(({ label }) => (
                    <span
                      key={label}
                      className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-medium text-[var(--c-text-secondary)]"
                      style={{ background: "var(--c-overlay-sm)", border: "1px solid var(--c-border)" }}
                    >
                      {label}
                    </span>
                  ))}
                </div>

                <div className="h-px bg-[var(--c-border)]" />

                <Link
                  href={`/agents/${agent._id}`}
                  className="flex items-center gap-1.5 text-xs font-medium text-[var(--brand)] hover:opacity-80 transition-smooth group-hover:gap-2.5"
                >
                  Configure agent
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
