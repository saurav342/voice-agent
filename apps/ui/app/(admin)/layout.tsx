import type { ReactNode } from "react";

import { requireSuperadmin } from "@/lib/session";
import { Sidebar } from "@/components/layout/sidebar";
import { getActingTenantId } from "@/lib/act-as-tenant";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireSuperadmin();
  const actingTenantId = await getActingTenantId();

  return (
    <div className="min-h-screen flex">
      <Sidebar isSuperadmin={true} isActingTenant={!!actingTenantId} />
      <main className="flex-1 px-8 py-6">{children}</main>
    </div>
  );
}
