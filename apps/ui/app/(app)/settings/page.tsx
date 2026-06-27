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
    <div className="flex items-center justify-between gap-4 py-3 border-b border-[var(--c-border)] last:border-0">
      <dt className="text-sm text-[var(--c-text-secondary)]">{label}</dt>
      <dd
        className="text-sm font-medium"
        style={
          mono
            ? {
                fontFamily: "var(--font-mono, monospace)",
                fontSize: "0.75rem",
                color: "var(--brand)",
                background: "oklch(0.55 0.28 275 / 0.07)",
                padding: "2px 8px",
                borderRadius: "6px",
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
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-[var(--c-text-secondary)]">
          Manage your account and session preferences
        </p>
      </div>

      {/* Profile card */}
      <div className="glass-card rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl icon-gradient-violet flex items-center justify-center text-white font-bold text-lg shrink-0"
            style={{ boxShadow: "0 6px 20px oklch(0.55 0.28 275 / 0.25)" }}
          >
            {initials}
          </div>
          <div>
            <div className="font-semibold text-base text-foreground">
              {user.isSuperadmin ? "Superadmin" : "Team Member"}
            </div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`badge ${user.isSuperadmin ? "badge-purple" : "badge-blue"}`}>
                {user.role}
              </span>
              {user.isSuperadmin && (
                <span className="badge badge-amber">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  Superadmin
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="h-px bg-[var(--c-border)]" />

        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--c-text-dim)] mb-1">
            Account Details
          </h2>
          <p className="text-xs text-[var(--c-text-dim)] mb-4">
            Read-only for now — profile editing lands soon.
          </p>
          <dl className="space-y-0">
            <InfoRow label="User ID"    value={user._id}              mono />
            <InfoRow label="Tenant ID"  value={user.tenantId ?? "—"}  mono />
            <InfoRow label="Role"       value={user.role} />
            <InfoRow label="Superadmin" value={user.isSuperadmin ? "Yes" : "No"} />
          </dl>
        </div>
      </div>

      {/* Session card */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">Session</h2>
          <p className="text-sm text-[var(--c-text-secondary)] mt-0.5">
            Sign out of your current session on this device.
          </p>
        </div>
        <div className="h-px bg-[var(--c-border)]" />
        <LogoutButton />
      </div>
    </div>
  );
}
