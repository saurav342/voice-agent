import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          Welcome back
        </h2>
        <p className="text-sm text-[var(--c-text-secondary)]">
          Sign in to your voice agent dashboard
        </p>
      </div>

      {/* Card */}
      <div className="glass-card rounded-2xl p-6 space-y-5">
        <LoginForm />
      </div>

      {/* Divider */}
      <div className="relative flex items-center gap-3">
        <div className="flex-1 h-px bg-[var(--c-border)]" />
        <span className="text-xs text-[var(--c-text-dim)]">or</span>
        <div className="flex-1 h-px bg-[var(--c-border)]" />
      </div>

      {/* Admin link */}
      <Link
        href="/admin"
        className={buttonVariants({ variant: "outline", className: "w-full bg-transparent border-[var(--c-border)] text-[var(--c-text-secondary)] hover:bg-[var(--c-overlay-sm)] hover:text-foreground transition-smooth rounded-xl" })}
      >
        <svg className="mr-2 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
        Admin Panel
      </Link>
      <p className="text-xs text-[var(--c-text-dim)] text-center">
        Sign in with your superadmin credentials
      </p>

      {/* Footer links */}
      <div className="flex items-center justify-between text-sm text-[var(--c-text-secondary)]">
        <Link href="/signup" className="hover:text-foreground transition-smooth hover:underline">
          Create account
        </Link>
        <Link href="/forgot-password" className="hover:text-foreground transition-smooth hover:underline">
          Forgot password?
        </Link>
      </div>
    </div>
  );
}
