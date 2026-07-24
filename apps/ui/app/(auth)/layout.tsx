import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import { getCurrentUser } from "@/lib/session";

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (user) redirect("/");

  return (
    <div className="min-h-screen flex selection:bg-[oklch(0.52_0.18_158_/_0.20)]">
      {/* ── Left panel: 2026 Animated Vaani Hero ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden mesh-gradient items-center justify-center p-12 border-r border-[var(--c-border)]">
        {/* Ambient floating glowing light orbs */}
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          aria-hidden="true"
        >
          <div
            className="absolute -top-12 left-1/4 w-[28rem] h-[28rem] rounded-full opacity-30 blur-3xl animate-float"
            style={{ background: "oklch(0.52 0.18 158)", animationDelay: "0s" }}
          />
          <div
            className="absolute bottom-10 right-10 w-96 h-96 rounded-full opacity-25 blur-3xl animate-float"
            style={{ background: "oklch(0.68 0.12 155)", animationDelay: "2s" }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full opacity-20 blur-3xl animate-float"
            style={{ background: "oklch(0.75 0.18 158)", animationDelay: "4s" }}
          />
        </div>

        {/* Dot grid matrix overlay */}
        <div className="absolute inset-0 dot-grid opacity-50" aria-hidden="true" />

        {/* Hero content card */}
        <div className="relative z-10 max-w-lg text-center animate-fade-up flex flex-col items-center">
          {/* Status Capsule */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[oklch(0.42_0.14_158_/_0.08)] dark:bg-[oklch(0.72_0.18_158_/_0.15)] border border-[oklch(0.42_0.14_158_/_0.20)] text-xs font-semibold text-[oklch(0.32_0.14_158)] dark:text-[oklch(0.85_0.14_158)] mb-8 shadow-sm backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[oklch(0.52_0.18_158)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[oklch(0.42_0.14_158)] dark:bg-[oklch(0.72_0.18_158)]"></span>
            </span>
            <span>AI Voice Engine 2.0 • Active</span>
          </div>

          {/* Vaani Logo Container with 2026 Glow */}
          <div className="relative group mb-8">
            <div className="absolute -inset-3 bg-gradient-to-r from-[oklch(0.42_0.14_158)] via-[oklch(0.68_0.12_155)] to-[oklch(0.75_0.18_158)] rounded-3xl blur-2xl opacity-25 group-hover:opacity-45 transition duration-500"></div>
            <div className="relative bg-white/20 dark:bg-slate-900/20 backdrop-blur-md rounded-3xl p-6 border border-white/40 dark:border-slate-800/40 shadow-xl transition-transform duration-500 group-hover:scale-[1.02] flex items-center justify-center">
              <Image
                src="/vaani_logo.png"
                alt="Vaani Logo"
                width={240}
                height={240}
                className="h-auto w-52 object-contain filter drop-shadow-sm"
                priority
              />
            </div>
          </div>

          {/* Interactive Soundwave Equalizer Visualizer */}
          <div className="flex items-center gap-1.5 h-10 mb-8 px-4 py-2 rounded-full bg-white/50 dark:bg-black/40 backdrop-blur-md border border-[var(--c-border)] shadow-inner">
            {[40, 75, 30, 90, 50, 100, 60, 85, 35, 70, 45, 80, 25, 65, 95, 40].map((h, i) => (
              <span
                key={i}
                className="w-1 bg-gradient-to-t from-[oklch(0.42_0.14_158)] to-[oklch(0.75_0.18_158)] rounded-full transition-all duration-300"
                style={{
                  height: `${h}%`,
                  animation: `soundwave 1.4s ease-in-out infinite alternate`,
                  animationDelay: `${(i % 5) * 0.2}s`,
                }}
              />
            ))}
          </div>

          {/* Hero text */}
          <p className="text-base sm:text-lg text-[var(--c-text-secondary)] leading-relaxed mb-8 max-w-md">
            Intelligent voice agents that handle your inbound and outbound calls with human-like precision.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2.5 justify-center">
            {[
              { label: "AI Voice Agents", icon: "🎙️" },
              { label: "Outbound Campaigns", icon: "⚡" },
              { label: "Real-time Analytics", icon: "📊" },
              { label: "Multi-tenant", icon: "🏢" }
            ].map((f) => (
              <span
                key={f.label}
                className="badge badge-emerald text-xs shadow-xs hover:scale-105 transition-transform"
              >
                <span className="mr-1">{f.icon}</span>
                {f.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel: Auth form container ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-background relative overflow-y-auto">
        {/* Subtle right-panel background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[oklch(0.52_0.18_158_/_0.04)] blur-3xl pointer-events-none" aria-hidden="true" />
        
        {/* Mobile logo */}
        <Link
          href="/"
          className="mb-8 flex items-center gap-3 lg:hidden group"
        >
          <div className="relative rounded-xl overflow-hidden p-1.5 bg-white/20 dark:bg-slate-900/20 backdrop-blur-sm border border-[var(--c-border)] shadow-xs">
            <Image
              src="/vaani_logo.png"
              alt="Vaani Logo"
              width={36}
              height={36}
              className="h-7 w-auto object-contain"
            />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">
            Vaani<span className="text-[oklch(0.42_0.14_158)] dark:text-[oklch(0.72_0.18_158)]">labs</span>
          </span>
        </Link>

        <div className="w-full max-w-sm animate-fade-up relative z-10">
          {children}
        </div>
      </div>
    </div>
  );
}

