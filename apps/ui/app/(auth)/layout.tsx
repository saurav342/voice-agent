import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";

import { getCurrentUser } from "@/lib/session";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel: animated brand hero ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden mesh-gradient items-center justify-center p-12">
        {/* Animated orbs */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
        >
          <div
            className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl animate-float"
            style={{ background: "oklch(0.65 0.28 275)", animationDelay: "0s" }}
          />
          <div
            className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full opacity-15 blur-3xl animate-float"
            style={{ background: "oklch(0.72 0.22 220)", animationDelay: "1.5s" }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full opacity-10 blur-2xl animate-float"
            style={{ background: "oklch(0.72 0.19 158)", animationDelay: "3s" }}
          />
        </div>

        {/* Dot grid overlay */}
        <div className="absolute inset-0 dot-grid opacity-40" aria-hidden="true" />

        {/* Hero content */}
        <div className="relative z-10 max-w-md text-center animate-fade-up">
          {/* Logo mark */}
          <div className="mx-auto mb-8 w-20 h-20 rounded-2xl icon-gradient-violet flex items-center justify-center shadow-2xl"
               style={{ boxShadow: "0 0 40px oklch(0.65 0.28 275 / 0.4)" }}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
              <path
                d="M8 20C8 20 12 10 20 10C28 10 32 20 32 20C32 20 28 30 20 30C12 30 8 20 8 20Z"
                stroke="white"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
              />
              <circle cx="14" cy="20" r="2" fill="white" opacity="0.6" />
              <circle cx="20" cy="16" r="2.5" fill="white" />
              <circle cx="26" cy="20" r="2" fill="white" opacity="0.6" />
              <circle cx="20" cy="24" r="1.5" fill="white" opacity="0.4" />
              {/* Soundwave lines */}
              <path d="M6 17 L6 23" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
              <path d="M34 17 L34 23" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
              <path d="M3 19 L3 21" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
              <path d="M37 19 L37 21" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
            </svg>
          </div>

          <h1 className="text-4xl font-bold mb-4 tracking-tight">
            <span className="gradient-text">Malama AI</span>
          </h1>
          <p className="text-lg text-[oklch(0.75_0.01_265)] leading-relaxed mb-8">
            Intelligent voice agents that handle your inbound and outbound calls with human-like precision.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 justify-center">
            {["AI Voice Agents", "Outbound Campaigns", "Real-time Analytics", "Multi-tenant"].map((f) => (
              <span
                key={f}
                className="badge badge-purple text-xs"
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel: form ── */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-4 py-12"
        style={{ background: "var(--surface-0)" }}
      >
        {/* Mobile logo */}
        <Link
          href="/"
          className="mb-10 flex items-center gap-3 lg:hidden"
        >
          <div className="w-9 h-9 rounded-xl icon-gradient-violet flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 40 40" fill="none" aria-hidden="true">
              <path d="M8 20C8 20 12 10 20 10C28 10 32 20 32 20C32 20 28 30 20 30C12 30 8 20 8 20Z"
                stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
              <circle cx="20" cy="20" r="3" fill="white"/>
            </svg>
          </div>
          <span className="text-xl font-bold gradient-text">Malama AI</span>
        </Link>

        <div className="w-full max-w-sm animate-fade-up">
          {children}
        </div>
      </div>
    </div>
  );
}
