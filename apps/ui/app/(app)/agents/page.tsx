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
  active:    { label: "Active",    cls: "badge-emerald" },
  published: { label: "Published", cls: "badge-emerald" },
  inactive:  { label: "Inactive",  cls: "badge-muted" },
  draft:     { label: "Draft",     cls: "badge-amber" },
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
    <div className="space-y-8">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 glass-card p-6 rounded-3xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge badge-emerald text-[11px] font-bold">
              AI Voice Fleet
            </span>
            <span className="text-xs text-[var(--c-text-dim)] font-medium">
              {agents.length} agent{agents.length !== 1 ? "s" : ""} configured
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground mt-1">
            Voice Agents
          </h1>
          <p className="mt-1 text-sm text-[var(--c-text-secondary)]">
            Create, tune prompts, test voices, and manage active real-time AI conversational agents.
          </p>
        </div>

        <Link
          href="/agents/new"
          id="new-agent-btn"
          className={buttonVariants({ className: "gap-2 font-bold rounded-xl px-5 text-white shadow-lg hover:scale-105 transition-all shrink-0" })}
          style={{
            background: "linear-gradient(135deg, oklch(0.42 0.14 158), oklch(0.55 0.16 155))",
            boxShadow: "0 4px 16px oklch(0.42 0.14 158 / 0.28)",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Agent
        </Link>
      </div>

      {agents.length === 0 ? (
        <div className="glass-card rounded-3xl p-16 flex flex-col items-center text-center gap-5 border border-dashed border-[var(--c-border)]">
          <div
            className="w-20 h-20 rounded-3xl icon-gradient-violet flex items-center justify-center mx-auto shadow-xl"
            style={{ boxShadow: "0 10px 30px oklch(0.42 0.14 158 / 0.30)" }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="8" r="4"/>
              <path d="M6 20v-1a6 6 0 0112 0v1"/>
            </svg>
          </div>
          <div className="space-y-1 max-w-sm">
            <h3 className="text-xl font-extrabold text-foreground">No agents created yet</h3>
            <p className="text-xs text-[var(--c-text-secondary)] leading-relaxed">
              Build your first intelligent voice agent with customizable ElevenLabs, Cartesia, or OpenAI speech engines.
            </p>
          </div>
          <Link
            href="/agents/new"
            className={buttonVariants({ className: "mt-2 rounded-xl font-bold px-6 text-white hover:scale-105 transition-transform" })}
            style={{
              background: "linear-gradient(135deg, oklch(0.42 0.14 158), oklch(0.55 0.16 155))",
              boxShadow: "0 4px 16px oklch(0.42 0.14 158 / 0.25)",
            }}
          >
            Create your first agent
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent, i) => {
            const statusCfg =
              STATUS_CONFIG[agent.status as keyof typeof STATUS_CONFIG] ??
              { label: agent.status, cls: "badge-muted" };

            return (
              <div
                key={agent._id}
                className="glass-card rounded-3xl p-6 flex flex-col justify-between gap-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group relative overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`w-14 h-14 rounded-2xl ${AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length]} flex items-center justify-center text-white font-extrabold text-base shrink-0 shadow-md transition-transform duration-300 group-hover:scale-105`}
                  >
                    {getInitials(agent.name)}
                  </div>
                  <span className={`badge ${statusCfg.cls}`}>
                    {(statusCfg.label === "Active" || statusCfg.label === "Published") && (
                      <span className="w-1.5 h-1.5 rounded-full bg-current inline-block animate-pulse" />
                    )}
                    {statusCfg.label}
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="font-extrabold text-lg leading-snug text-foreground group-hover:text-[var(--brand)] transition-colors">
                    {agent.name}
                  </h3>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      { label: agent.voice.provider, icon: "🎙️" },
                      { label: agent.llm.realtimeModel, icon: "⚡" },
                      ...(agent.voice.providerVoiceId ? [{ label: agent.voice.providerVoiceId, icon: "🆔" }] : []),
                    ].map(({ label, icon }) => (
                      <span
                        key={label}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-[var(--c-text-secondary)] bg-[var(--c-overlay-sm)] border border-[var(--c-border)]"
                      >
                        <span>{icon}</span>
                        <span className="truncate max-w-[120px]">{label}</span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="border-t border-[var(--c-border)] pt-4 flex items-center justify-between">
                  <span className="text-xs text-[var(--c-text-dim)] font-medium">
                    Ready for calls
                  </span>
                  <Link
                    href={`/agents/${agent._id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--brand)] hover:underline transition-all group-hover:gap-2"
                  >
                    Configure
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

