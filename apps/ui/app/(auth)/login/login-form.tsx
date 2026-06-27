"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-sm font-medium text-foreground">
          Email address
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@company.com"
          className="h-11 bg-[var(--c-input-bg)] border-[var(--c-border)] placeholder:text-[var(--c-text-dim)] focus-visible:ring-[var(--brand)] focus-visible:border-[var(--brand)] transition-smooth rounded-xl"
        />
        {state.fieldErrors?.email && (
          <p className="text-xs text-[var(--accent-red)]">{state.fieldErrors.email[0]}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-sm font-medium text-foreground">
          Password
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          className="h-11 bg-[var(--c-input-bg)] border-[var(--c-border)] placeholder:text-[var(--c-text-dim)] focus-visible:ring-[var(--brand)] focus-visible:border-[var(--brand)] transition-smooth rounded-xl"
        />
        {state.fieldErrors?.password && (
          <p className="text-xs text-[var(--accent-red)]">{state.fieldErrors.password[0]}</p>
        )}
      </div>

      {state.error && (
        <div className="rounded-xl p-3 bg-[oklch(0.52_0.22_24_/_0.08)] border border-[oklch(0.52_0.22_24_/_0.20)]">
          <p className="text-sm text-[var(--accent-red)]">{state.error}</p>
        </div>
      )}

      <Button
        type="submit"
        className="w-full h-11 font-semibold rounded-xl relative overflow-hidden transition-smooth text-white"
        disabled={pending}
        style={{
          background: pending
            ? "oklch(0.48 0.22 275)"
            : "linear-gradient(135deg, oklch(0.55 0.28 275), oklch(0.50 0.25 240))",
          boxShadow: pending ? "none" : "0 4px 16px oklch(0.55 0.28 275 / 0.28)",
        }}
      >
        {pending ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Signing in…
          </span>
        ) : (
          "Sign in"
        )}
      </Button>
    </form>
  );
}
