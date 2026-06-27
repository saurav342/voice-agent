import { clearTenant } from "@/lib/act-as-tenant";

interface Props {
  tenantName: string;
}

/**
 * Shown on tenant-scoped pages when a superadmin is impersonating a
 * tenant. The "Back to admin" button clears the act-as cookie and
 * returns the SA to /admin/tenants.
 */
export function ActingAsBanner({ tenantName }: Props) {
  return (
    <div
      className="mb-6 flex items-center justify-between rounded-xl px-4 py-3 text-sm"
      style={{
        background: "oklch(0.78 0.18 75 / 0.10)",
        border: "1px solid oklch(0.78 0.18 75 / 0.25)",
        color: "oklch(0.80 0.17 75)",
      }}
    >
      <div className="flex items-center gap-2.5">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
        <span>
          Acting as tenant:{" "}
          <span className="font-semibold">{tenantName}</span>
        </span>
      </div>
      <form
        action={async () => {
          "use server";
          await clearTenant("/admin/tenants");
        }}
      >
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-smooth hover:bg-[oklch(0.78_0.18_75_/_0.15)]"
          style={{ color: "oklch(0.80 0.17 75)" }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
          Back to admin
        </button>
      </form>
    </div>
  );
}
