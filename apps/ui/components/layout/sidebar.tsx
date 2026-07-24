"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

/* ── Icons ─────────────────────────────────────────────────────────────── */
const Icons = {
  Dashboard: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
    </svg>
  ),
  Agents: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M6 20v-1a6 6 0 0112 0v1" />
      <path d="M16 3.5C17.7 4.2 19 5.9 19 8s-1.3 3.8-3 4.5" />
    </svg>
  ),
  Campaigns: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  ),
  Calls: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z" />
    </svg>
  ),
  Voices: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
      <path d="M19 10v2a7 7 0 01-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  ),
  Credits: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M15 9.354A4 4 0 109 12.77" />
      <path d="M12 6v2m0 8v2" />
    </svg>
  ),
  Settings: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  Tenants: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  DIDs: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  ),
  Shield: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  Zap: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
};

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType;
}

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: Icons.Dashboard },
  { href: "/agents", label: "Agents", icon: Icons.Agents },
  { href: "/campaigns", label: "Campaigns", icon: Icons.Campaigns },
  { href: "/calls", label: "Calls", icon: Icons.Calls },
  { href: "/voices", label: "Voices", icon: Icons.Voices },
  { href: "/credits", label: "Credits", icon: Icons.Credits },
  { href: "/settings", label: "Settings", icon: Icons.Settings },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/admin/tenants", label: "Tenants", icon: Icons.Tenants },
  { href: "/admin/dids", label: "DIDs", icon: Icons.DIDs },
  { href: "/admin/credits", label: "Credits", icon: Icons.Credits },
];

interface Props {
  isSuperadmin: boolean;
  isActingTenant?: boolean;
  balance?: number | null;
  className?: string;
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative group select-none",
        active
          ? "bg-[oklch(0.42_0.14_158_/_0.12)] dark:bg-[oklch(0.72_0.18_158_/_0.16)] text-[var(--brand)] font-semibold shadow-xs"
          : "text-[var(--c-text-secondary)] hover:text-foreground hover:bg-[var(--c-overlay-sm)]",
      )}
    >
      <span className={cn(
        "shrink-0 transition-transform duration-200 group-hover:scale-110",
        active ? "text-[var(--brand)]" : "text-[var(--c-text-dim)] group-hover:text-[var(--c-text-secondary)]"
      )}>
        <Icon />
      </span>
      <span className="flex-1">{item.label}</span>
      {active && (
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand)] shrink-0 animate-pulse shadow-sm shadow-[var(--brand-glow)]" />
      )}
    </Link>
  );
}

export function Sidebar({ isSuperadmin, isActingTenant, balance, className }: Props) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href);

  const creditsPct =
    balance != null && balance > 0
      ? Math.min(100, (balance / 10000) * 100)
      : 0;

  return (
    <nav
      className={cn(
        "w-64 shrink-0 flex flex-col h-screen sticky top-0 backdrop-blur-xl border-r border-[var(--c-border)] z-20",
        className,
      )}
      style={{ background: "var(--sidebar)" }}
    >
      {/* ── Brand Logo Header ── */}
      <div className="px-5 py-5 border-b border-[var(--c-border)]">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="relative rounded-2xl p-2 bg-white/90 dark:bg-slate-900/90 border border-[var(--c-border)] shadow-md transition-transform duration-300 group-hover:scale-105 shrink-0 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[oklch(0.42_0.14_158_/_0.15)] to-transparent pointer-events-none" />
            <Image
              src="/vaani_logo.png"
              alt="Vaani Logo"
              width={34}
              height={34}
              className="h-7 w-auto object-contain relative z-10"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-foreground group-hover:text-[var(--brand)] transition-colors">
              Vaani<span className="text-[var(--brand)] font-extrabold">AI</span>
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent-green)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[var(--accent-green)]"></span>
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase text-[var(--c-text-dim)]">
                Voice Platform 2.0
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* ── Navigation Links ── */}
      <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1">
        {(!isSuperadmin || isActingTenant) && NAV.map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item.href)} />
        ))}

        {isSuperadmin && (
          <>
            <div className="pt-5 pb-2 px-3.5">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[var(--c-text-dim)]">
                <Icons.Shield />
                <span>Superadmin Control</span>
              </div>
            </div>
            <div className="h-px bg-[var(--c-border)] mx-2 mb-2 opacity-60" />
            {ADMIN_NAV.map((item) => (
              <NavLink key={item.href} item={item} active={isActive(item.href)} />
            ))}
          </>
        )}
      </div>

      {/* ── Credits Widget ── */}
      {balance !== null && balance !== undefined && (
        <div className="p-4 m-3 rounded-2xl glass-card border border-[var(--c-border)]">
          <Link href="/credits" className="block group">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-[var(--brand)]">
                <Icons.Credits />
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--c-text-secondary)]">
                  Credits
                </span>
              </div>
              <span className="flex items-center gap-1 text-[10px] font-medium text-[var(--brand)] group-hover:underline transition-all">
                Ledger
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </span>
            </div>
            <div
              className={cn(
                "text-2xl font-extrabold tracking-tight mb-2",
                balance < 0
                  ? "text-[var(--accent-red)]"
                  : balance < 1000
                    ? "text-[var(--accent-amber)]"
                    : "text-foreground",
              )}
            >
              {balance.toLocaleString()}
            </div>
            <div className="h-2 rounded-full bg-[var(--c-overlay-md)] overflow-hidden p-0.5 border border-[var(--c-border)]">
              <div
                className="h-full rounded-full transition-all duration-500 shadow-xs"
                style={{
                  width: `${creditsPct}%`,
                  background: creditsPct > 50
                    ? "linear-gradient(90deg, oklch(0.52 0.18 158), oklch(0.68 0.12 155))"
                    : creditsPct > 20
                      ? "linear-gradient(90deg, oklch(0.60 0.18 75), oklch(0.65 0.16 60))"
                      : "linear-gradient(90deg, oklch(0.52 0.22 24), oklch(0.60 0.20 15))",
                }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] font-medium text-[var(--c-text-dim)]">
              <span className="flex items-center gap-1 text-[var(--accent-green)]">
                <Icons.Zap />
                <span>{creditsPct.toFixed(0)}% available</span>
              </span>
              <span>1s / credit</span>
            </div>
          </Link>
        </div>
      )}
    </nav>
  );
}

