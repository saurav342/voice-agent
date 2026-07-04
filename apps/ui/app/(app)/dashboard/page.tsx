import { api, ApiError } from "@/lib/api";
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
      subtext: "Across all campaigns",
      iconClass: "icon-gradient-violet",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="8" r="4"/>
          <path d="M6 20v-1a6 6 0 0112 0v1"/>
        </svg>
      ),
    },
    {
      id: "calls-today",
      label: "Calls Today",
      value: String(stats.callsToday),
      subtext: "Inbound & outbound",
      iconClass: "icon-gradient-green",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z"/>
        </svg>
      ),
    },
    {
      id: "active-campaigns",
      label: "Active Campaigns",
      value: String(stats.activeCampaigns),
      subtext: "Running right now",
      iconClass: "icon-gradient-amber",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero greeting */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {greeting} 👋
        </h1>
        <p className="mt-1 text-sm text-[var(--c-text-secondary)]">
          Here&apos;s what&apos;s happening with your voice agents today.
        </p>
      </div>

      {/* KPI stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((card, i) => (
          <div
            key={card.id}
            id={card.id}
            className="glass-card rounded-2xl p-5 flex flex-col gap-4 transition-smooth hover:shadow-md group"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex items-start justify-between">
              <div
                className={`w-10 h-10 rounded-xl ${card.iconClass} flex items-center justify-center shrink-0 shadow-md transition-smooth group-hover:scale-110`}
              >
                {card.icon}
              </div>
              <span className="badge badge-muted text-[10px]">Live</span>
            </div>
            <div>
              <div className="text-3xl font-bold tracking-tight text-foreground">{card.value}</div>
              <div className="text-xs text-[var(--c-text-secondary)] mt-0.5">{card.label}</div>
            </div>
            <div className="h-px bg-[var(--c-border)]" />
            <p className="text-xs text-[var(--c-text-dim)]">{card.subtext}</p>
          </div>
        ))}
      </div>

      {/* Quick Dial */}
      <PlaceCall />

      {/* Coming soon notice */}
      <div
        className="flex items-start gap-3 rounded-xl p-4 border"
        style={{
          background: "var(--c-info-bg)",
          borderColor: "var(--c-info-border)",
        }}
      >
        <div className="mt-0.5 shrink-0" style={{ color: "var(--c-info-text)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <p className="text-sm" style={{ color: "var(--c-info-text)" }}>
          <span className="font-semibold" style={{ color: "var(--c-info-heading)" }}>Live metrics are on their way.</span>{" "}
          Real-time call stats, agent performance, and campaign analytics will appear here once Stream S1 ships.
        </p>
      </div>
    </div>
  );
}
