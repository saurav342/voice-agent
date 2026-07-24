import { requireUser } from "@/lib/session";
import { LogoutButton } from "./logout-button";

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5 border-b border-[var(--c-border)] last:border-0">
      <dt className="text-xs font-semibold uppercase tracking-wider text-[var(--c-text-dim)]">{label}</dt>
      <dd
        className="text-xs font-semibold text-foreground"
        style={
          mono
            ? {
                fontFamily: "var(--font-mono, monospace)",
                color: "var(--brand)",
                background: "oklch(0.42 0.14 158 / 0.08)",
                padding: "3px 10px",
                borderRadius: "8px",
                border: "1px solid oklch(0.42 0.14 158 / 0.18)",
              }
            : {}
        }
      >
        {value}
      </dd>
    </div>
  );
}

export default async function SettingsPage() {
  const user = await requireUser();

  const initials = user.isSuperadmin
    ? "SA"
    : (user as { email?: string }).email
      ? ((user as { email: string }).email[0] ?? "U").toUpperCase()
      : "U";

  return (
    <div className="max-w-3xl space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 glass-card p-6 rounded-3xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge badge-emerald text-[11px] font-bold">
              Account Workspace
            </span>
            <span className="text-xs text-[var(--c-text-dim)] font-medium">
              Profile & Security Settings
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground mt-1">
            Settings & Security
          </h1>
          <p className="mt-1 text-sm text-[var(--c-text-secondary)]">
            View user session details, role permissions, organization IDs, and manage active logins.
          </p>
        </div>
      </div>

      {/* Profile Card */}
      <div className="glass-card rounded-3xl p-6 space-y-6 border border-[var(--c-border)] shadow-lg relative overflow-hidden">
        <div className="flex items-center gap-5">
          <div
            className="w-16 h-16 rounded-2xl icon-gradient-violet flex items-center justify-center text-white font-extrabold text-xl shrink-0 shadow-lg"
            style={{ boxShadow: "0 6px 20px oklch(0.42 0.14 158 / 0.30)" }}
          >
            {initials}
          </div>
          <div className="space-y-1">
            <h2 className="font-extrabold text-xl text-foreground">
              {user.isSuperadmin ? "Superadmin Account" : "Workspace Administrator"}
            </h2>
            <div className="flex items-center gap-2">
              <span className={`badge ${user.isSuperadmin ? "badge-purple" : "badge-emerald"}`}>
                {user.role}
              </span>
              {user.isSuperadmin && (
                <span className="badge badge-amber">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  Superadmin Scope
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="h-px bg-[var(--c-border)]" />

        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-[var(--c-text-dim)]">
              Account Attributes & Metadata
            </h3>
            <span className="text-[10px] text-[var(--c-text-dim)] font-medium">Read-Only</span>
          </div>
          <dl className="space-y-0">
            <InfoRow label="User Account ID" value={user._id} mono />
            <InfoRow label="Tenant Workspace ID" value={user.tenantId ?? "—"} mono />
            <InfoRow label="Assigned Role" value={user.role} />
            <InfoRow label="Superadmin Privileges" value={user.isSuperadmin ? "Enabled" : "Disabled"} />
          </dl>
        </div>
      </div>

      {/* Session Management Card */}
      <div className="glass-card rounded-3xl p-6 space-y-4 border border-[var(--c-border)] shadow-lg">
        <div>
          <h3 className="text-lg font-bold text-foreground">Session Control</h3>
          <p className="text-xs text-[var(--c-text-secondary)] mt-0.5">
            Sign out of your active dashboard session on this browser.
          </p>
        </div>
        <div className="h-px bg-[var(--c-border)]" />
        <LogoutButton />
      </div>
    </div>
  );
}

