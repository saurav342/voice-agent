import Link from "next/link";
import { api } from "@/lib/api";
import { PlaceCall } from "./place-call";

interface DashboardStats {
  activeAgents: number;
  callsToday: number;
  activeCampaigns: number;
}

async function fetchStats(): Promise<DashboardStats> {
  try {
    return await api.get<DashboardStats>("/dashboard/stats");
  } catch (err) {
    console.error("Failed to fetch dashboard stats:", err);
    return { activeAgents: 0, callsToday: 0, activeCampaigns: 0 };
  }
}

export default async function DashboardPage() {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const stats = await fetchStats();

  const cards = [
    {
      id: "active-agents",
      label: "Active Agents",
      value: String(stats.activeAgents),
      subtext: "Across all active campaigns",
      trend: "+100% engine uptime",
      href: "/agents",
      iconClass: "icon-gradient-violet",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="8" r="4"/>
          <path d="M6 20v-1a6 6 0 0112 0v1"/>
        </svg>
      ),
    },
    {
      id: "calls-today",
      label: "Calls Today",
      value: String(stats.callsToday),
      subtext: "Inbound & outbound sessions",
      trend: "Real-time dispatching",
      href: "/calls",
      iconClass: "icon-gradient-green",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z"/>
        </svg>
      ),
    },
    {
      id: "active-campaigns",
      label: "Active Campaigns",
      value: String(stats.activeCampaigns),
      subtext: "Running right now",
      trend: "Automated queue",
      href: "/campaigns",
      iconClass: "icon-gradient-amber",
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Greeting & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 glass-card p-6 rounded-3xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-gradient-to-bl from-[oklch(0.42_0.14_158_/_0.10)] to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2">
            <span className="badge badge-emerald text-[11px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              Live Workspace
            </span>
            <span className="text-xs text-[var(--c-text-dim)] font-medium">
              {new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            {greeting}, <span className="gradient-text">Welcome Back</span> 👋
          </h1>
          <p className="text-sm text-[var(--c-text-secondary)] max-w-xl">
            Here&apos;s real-time overview of your AI voice agents, active campaign pipelines, and live phone calls today.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 relative z-10">
          <Link
            href="/agents/new"
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all duration-200 shadow-md hover:scale-105"
            style={{
              background: "linear-gradient(135deg, oklch(0.42 0.14 158), oklch(0.55 0.16 155))",
              boxShadow: "0 4px 16px oklch(0.42 0.14 158 / 0.25)",
            }}
          >
            + Create Agent
          </Link>
          <Link
            href="/campaigns/new"
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-foreground border border-[var(--c-border)] bg-[var(--c-overlay-sm)] hover:bg-[var(--c-overlay-md)] transition-all"
          >
            Launch Campaign
          </Link>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {cards.map((card, i) => (
          <Link
            key={card.id}
            id={card.id}
            href={card.href}
            className="glass-card rounded-2xl p-6 flex flex-col justify-between gap-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group relative overflow-hidden"
            style={{ animationDelay: `${i * 90}ms` }}
          >
            <div className="flex items-start justify-between">
              <div
                className={`w-12 h-12 rounded-2xl ${card.iconClass} flex items-center justify-center shrink-0 shadow-lg transition-transform duration-300 group-hover:scale-110`}
              >
                {card.icon}
              </div>
              <span className="badge badge-emerald text-[10px] font-bold">
                Live
              </span>
            </div>

            <div>
              <div className="text-4xl font-black tracking-tight text-foreground group-hover:text-[var(--brand)] transition-colors">
                {card.value}
              </div>
              <div className="text-xs font-semibold text-[var(--c-text-secondary)] mt-1">
                {card.label}
              </div>
            </div>

            <div className="space-y-2 border-t border-[var(--c-border)] pt-3">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-[var(--c-text-dim)]">{card.subtext}</span>
                <span className="text-[var(--accent-green)] font-semibold flex items-center gap-1">
                  {card.trend}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Dial Control Hub */}
      <PlaceCall />

      {/* Real-time Streaming Metrics Alert */}
      <div
        className="flex items-start gap-4 rounded-2xl p-5 border shadow-sm backdrop-blur-md relative overflow-hidden"
        style={{
          background: "var(--c-info-bg)",
          borderColor: "var(--c-info-border)",
        }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "oklch(0.42 0.14 158 / 0.15)", color: "var(--brand)" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold" style={{ color: "var(--c-info-heading)" }}>
            Live Stream Analytics Engine
          </h4>
          <p className="text-xs leading-relaxed" style={{ color: "var(--c-info-text)" }}>
            Real-time call latency graphs, live speech sentiment indicators, and automated agent performance metrics are powered by Vaani Stream S1.
          </p>
        </div>
      </div>
    </div>
  );
}

