import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1.5 text-left">
        <h2 className="text-3xl font-extrabold tracking-tight text-foreground font-sans">
          Welcome back
        </h2>
        <p className="text-sm font-medium text-[var(--c-text-secondary)]">
          Sign in to your voice agent dashboard
        </p>
      </div>

      {/* Modern Glass Card */}
      <div className="glass-card rounded-2xl p-6 sm:p-7 space-y-5 backdrop-blur-2xl border border-white/60 dark:border-slate-800/60 shadow-xl shadow-[oklch(0.42_0.14_158_/_0.05)]">
        <LoginForm />
      </div>

      {/* Divider */}
      <div className="relative flex items-center gap-3 py-1">
        <div className="flex-1 h-px bg-[var(--c-border)]" />
        <span className="text-xs font-medium text-[var(--c-text-dim)] uppercase tracking-wider">or</span>
        <div className="flex-1 h-px bg-[var(--c-border)]" />
      </div>

      {/* Admin Panel button */}
      <div className="space-y-2">
        <Link
          href="/admin"
          className={buttonVariants({
            variant: "outline",
            className: "w-full h-11 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border-[var(--c-border)] text-foreground hover:bg-[oklch(0.42_0.14_158_/_0.08)] dark:hover:bg-[oklch(0.72_0.18_158_/_0.15)] hover:border-[oklch(0.42_0.14_158_/_0.30)] transition-all duration-300 rounded-xl font-medium shadow-xs"
          })}
        >
          <svg className="mr-2.5 w-4 h-4 text-[oklch(0.42_0.14_158)] dark:text-[oklch(0.72_0.18_158)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
          Admin Panel
        </Link>
        <p className="text-xs text-[var(--c-text-dim)] text-center font-medium">
          Sign in with your superadmin credentials
        </p>
      </div>

      {/* Footer links */}
      <div className="flex items-center justify-between text-sm pt-2">
        <Link
          href="/signup"
          className="font-medium text-[var(--c-text-secondary)] hover:text-[oklch(0.42_0.14_158)] dark:hover:text-[oklch(0.72_0.18_158)] transition-colors hover:underline underline-offset-4"
        >
          Create account
        </Link>
        <Link
          href="/forgot-password"
          className="font-medium text-[var(--c-text-secondary)] hover:text-[oklch(0.42_0.14_158)] dark:hover:text-[oklch(0.72_0.18_158)] transition-colors hover:underline underline-offset-4"
        >
          Forgot password?
        </Link>
      </div>
    </div>
  );
}

