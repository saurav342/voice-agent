import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";

import { requireUser } from "@/lib/session";
import { api, ApiError } from "@/lib/api";
import { getActingTenantId } from "@/lib/act-as-tenant";
import type { Tenant } from "@voiceplatform/shared";

import { Sidebar } from "@/components/layout/sidebar";
import { ActingAsBanner } from "@/components/layout/acting-as-banner";

async function fetchBalance(): Promise<number | null> {
  try {
    const { balance } = await api.get<{ balance: number }>("/credits?limit=1");
    return balance;
  } catch (err) {
    if (err instanceof ApiError) return null;
    return null;
  }
}

async function fetchActingTenant(): Promise<Tenant | null> {
  const id = await getActingTenantId();
  if (!id) return null;
  try {
    const { tenants } = await api.get<{ tenants: Tenant[] }>("/admin/tenants");
    return tenants.find((t) => t._id === id) ?? null;
  } catch (err) {
    if (err instanceof ApiError) return null;
    throw err;
  }
}

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const actingTenant = user.isSuperadmin ? await fetchActingTenant() : null;

  if (user.isSuperadmin && !actingTenant) {
    redirect("/admin/tenants");
  }

  const balance = await fetchBalance();

  return (
    <div className="min-h-screen flex bg-background selection:bg-[oklch(0.52_0.18_158_/_0.20)]">
      <Sidebar isSuperadmin={user.isSuperadmin} isActingTenant={!!actingTenant} balance={balance} />

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden relative">
        {/* Top header bar */}
        <header
          className="sticky top-0 z-10 flex items-center justify-between px-8 h-16 border-b border-[var(--c-border)]"
          style={{ background: "var(--c-header-bg)", backdropFilter: "blur(16px)" }}
        >
          {/* Left section: Breadcrumb & Status */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-medium text-[var(--c-text-dim)] select-none">
              <span className="text-[var(--brand)] font-semibold">Vaani Dashboard</span>
              <span>/</span>
              <span className="text-foreground">Overview</span>
            </div>

            {/* Live Engine Status Capsule */}
            <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[oklch(0.42_0.14_158_/_0.08)] dark:bg-[oklch(0.72_0.18_158_/_0.15)] border border-[oklch(0.42_0.14_158_/_0.18)] text-xs font-semibold text-[oklch(0.32_0.14_158)] dark:text-[oklch(0.85_0.14_158)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent-green)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent-green)]"></span>
              </span>
              <span>Engine Active • 12ms Realtime</span>
            </div>
          </div>

          {/* Right section: Quick action + Notifications + User */}
          <div className="flex items-center gap-3">
            {/* Quick action button */}
            <Link
              href="/agents/new"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition-all duration-200 shadow-md hover:scale-105"
              style={{
                background: "linear-gradient(135deg, oklch(0.42 0.14 158), oklch(0.55 0.16 155))",
                boxShadow: "0 4px 14px oklch(0.42 0.14 158 / 0.25)",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              New Agent
            </Link>

            {/* Notification bell */}
            <button
              className="relative w-9 h-9 rounded-xl flex items-center justify-center text-[var(--c-text-secondary)] hover:text-foreground hover:bg-[var(--c-overlay-sm)] transition-all border border-[var(--c-border)]"
              aria-label="Notifications"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 01-3.46 0"/>
              </svg>
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[var(--brand)] animate-pulse" />
            </button>

            {/* User profile capsule */}
            <Link
              href="/settings"
              className="flex items-center gap-2.5 p-1.5 pl-2.5 rounded-xl border border-[var(--c-border)] hover:bg-[var(--c-overlay-sm)] transition-all group"
            >
              <div className="text-left hidden sm:block">
                <div className="text-xs font-semibold text-foreground leading-none">
                  {user.isSuperadmin ? "Superadmin" : "Workspace Admin"}
                </div>
                <div className="text-[10px] text-[var(--c-text-dim)] mt-0.5 font-medium">
                  {user.role}
                </div>
              </div>
              <div
                className="w-8 h-8 rounded-lg icon-gradient-violet flex items-center justify-center text-xs font-bold text-white shrink-0 transition-transform group-hover:scale-105"
                style={{ boxShadow: "0 2px 10px oklch(0.42 0.14 158 / 0.30)" }}
              >
                {user.isSuperadmin ? "SA" : "U"}
              </div>
            </Link>
          </div>
        </header>

        {/* Page content container */}
        <main className="flex-1 px-8 py-8 dot-grid relative">
          {actingTenant && <ActingAsBanner tenantName={actingTenant.name} />}
          <div className="animate-fade-up max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

