import type { ReactNode } from "react";
import { redirect } from "next/navigation";

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
    <div className="min-h-screen flex bg-background">
      <Sidebar isSuperadmin={user.isSuperadmin} isActingTenant={!!actingTenant} balance={balance} />

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top header bar */}
        <header
          className="sticky top-0 z-10 flex items-center justify-between px-8 h-14 border-b border-[var(--c-border)]"
          style={{ background: "var(--c-header-bg)", backdropFilter: "blur(12px)" }}
        >
          <div className="flex items-center gap-2 text-sm text-[var(--c-text-dim)]">
            <span>/</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <button
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--c-text-secondary)] hover:text-foreground hover:bg-[var(--c-overlay-sm)] transition-smooth"
              aria-label="Notifications"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 01-3.46 0"/>
              </svg>
            </button>

            {/* User avatar */}
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full icon-gradient-violet flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ boxShadow: "0 0 10px oklch(0.55 0.28 275 / 0.20)" }}
              >
                {user.isSuperadmin ? "SA" : "U"}
              </div>
              {user.isSuperadmin && (
                <span className="badge badge-purple text-[10px]">Superadmin</span>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-8 py-8 dot-grid">
          {actingTenant && <ActingAsBanner tenantName={actingTenant.name} />}
          <div className="animate-fade-up">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
