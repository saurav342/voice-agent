"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-4.5">
      {/* Email input field */}
      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-foreground">
          Email address
        </Label>
        <div className="relative flex items-center">
          <div className="absolute left-3.5 pointer-events-none text-[var(--c-text-dim)]">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@company.com"
            className="h-11 pl-10 pr-4 bg-white/60 dark:bg-slate-950/40 border-[var(--c-border)] placeholder:text-[var(--c-text-dim)] focus-visible:ring-2 focus-visible:ring-[oklch(0.42_0.14_158)] focus-visible:border-transparent transition-all rounded-xl text-sm font-medium"
          />
        </div>
        {state.fieldErrors?.email && (
          <p className="text-xs font-medium text-[var(--accent-red)] animate-fade-up">{state.fieldErrors.email[0]}</p>
        )}
      </div>

      {/* Password input field */}
      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-foreground">
          Password
        </Label>
        <div className="relative flex items-center">
          <div className="absolute left-3.5 pointer-events-none text-[var(--c-text-dim)]">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className="h-11 pl-10 pr-11 bg-white/60 dark:bg-slate-950/40 border-[var(--c-border)] placeholder:text-[var(--c-text-dim)] focus-visible:ring-2 focus-visible:ring-[oklch(0.42_0.14_158)] focus-visible:border-transparent transition-all rounded-xl text-sm font-medium"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 text-[var(--c-text-dim)] hover:text-foreground transition-colors p-1 rounded-lg focus:outline-none"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
        {state.fieldErrors?.password && (
          <p className="text-xs font-medium text-[var(--accent-red)] animate-fade-up">{state.fieldErrors.password[0]}</p>
        )}
      </div>

      {/* Error Banner */}
      {state.error && (
        <div className="rounded-xl p-3.5 bg-red-500/10 border border-red-500/20 flex items-center gap-2.5 animate-fade-up">
          <svg className="w-4 h-4 text-red-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-xs font-medium text-red-600 dark:text-red-400">{state.error}</p>
        </div>
      )}

      {/* Submit Action Button */}
      <Button
        type="submit"
        className="w-full h-11 font-semibold rounded-xl relative overflow-hidden transition-all duration-300 text-white shadow-lg group hover:scale-[1.01]"
        disabled={pending}
        style={{
          background: pending
            ? "oklch(0.35 0.10 158)"
            : "linear-gradient(135deg, oklch(0.38 0.14 158) 0%, oklch(0.52 0.18 158) 100%)",
          boxShadow: pending ? "none" : "0 8px 24px oklch(0.42 0.14 158 / 0.35)",
        }}
      >
        <span className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        {pending ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Signing in…
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            Sign in
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="M12 5l7 7-7 7" />
            </svg>
          </span>
        )}
      </Button>
    </form>
  );
}

