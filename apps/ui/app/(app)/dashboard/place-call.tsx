"use client";

import { useState } from "react";

type Status = { kind: "idle" | "calling" | "ok" | "err"; msg?: string };

export function PlaceCall() {
  const [number, setNumber] = useState("0");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function call() {
    setStatus({ kind: "calling" });
    try {
      const res = await fetch("/api/calls/dial", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ toNumber: number.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus({ kind: "err", msg: data.error ?? `Call failed (${res.status})` });
        return;
      }
      setStatus({ kind: "ok", msg: `Calling ${data.from} → ${data.to}. Pick up your phone.` });
    } catch (e) {
      setStatus({ kind: "err", msg: (e as Error).message });
    }
  }

  return (
    <div className="glass-card rounded-3xl p-6 relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl icon-gradient-violet flex items-center justify-center shrink-0 shadow-lg"
            style={{ boxShadow: "0 6px 20px oklch(0.42 0.14 158 / 0.30)" }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Quick Dial Control Hub</h2>
            <p className="text-xs text-[var(--c-text-secondary)]">
              Dispatch an instant AI voice agent call to any phone number worldwide
            </p>
          </div>
        </div>

        {/* Status indicator pill */}
        {status.kind === "calling" && (
          <div className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-white/50 dark:bg-black/40 border border-[var(--c-border)]">
            {[40, 75, 30, 90, 50, 80, 45, 70].map((h, i) => (
              <span
                key={i}
                className="w-1 bg-[var(--brand)] rounded-full animate-pulse"
                style={{
                  height: `${h}%`,
                  animationDuration: `${0.6 + (i % 3) * 0.2}s`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="h-px bg-[var(--c-border)] mb-5" />

      <p className="text-xs text-[var(--c-text-secondary)] mb-4">
        Enter a 10-digit mobile number. For India, enter (e.g. 0 or 9307512816). The Vaani AI agent will call immediately.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 max-w-xl">
        <div className="flex-1 relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--brand)]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
              <line x1="12" y1="18" x2="12.01" y2="18" />
            </svg>
          </span>
          <input
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="Enter phone number"
            inputMode="tel"
            id="quick-dial-number"
            className="w-full h-12 pl-10 pr-4 rounded-xl text-sm font-mono border text-foreground focus:outline-none focus:ring-2 transition-all shadow-inner"
            style={{
              background: "var(--c-input-bg)",
              borderColor: "var(--c-border)",
              "--tw-ring-color": "var(--brand)",
            } as React.CSSProperties}
          />
        </div>

        <button
          id="quick-dial-call-btn"
          onClick={call}
          disabled={status.kind === "calling"}
          className="h-12 px-7 rounded-xl text-sm font-bold text-white transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed hover:scale-105 active:scale-95 shrink-0"
          style={{
            background:
              status.kind === "calling"
                ? "oklch(0.42 0.14 158)"
                : "linear-gradient(135deg, oklch(0.42 0.14 158), oklch(0.55 0.16 155))",
            boxShadow:
              status.kind === "calling"
                ? "none"
                : "0 6px 20px oklch(0.42 0.14 158 / 0.30)",
          }}
        >
          {status.kind === "calling" ? (
            <span className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" aria-hidden="true" />
              Dispatching…
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z" />
              </svg>
              Call Now
            </span>
          )}
        </button>
      </div>

      {status.msg && (
        <div
          className="mt-5 flex items-start gap-3 rounded-2xl p-4 text-xs font-medium animate-fade-up"
          style={
            status.kind === "err"
              ? {
                background: "oklch(0.52 0.22 24 / 0.08)",
                border: "1px solid oklch(0.52 0.22 24 / 0.22)",
                color: "var(--accent-red)",
              }
              : {
                background: "oklch(0.42 0.14 158 / 0.08)",
                border: "1px solid oklch(0.42 0.14 158 / 0.22)",
                color: "var(--brand)",
              }
          }
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0" aria-hidden="true">
            {status.kind === "err" ? (
              <>
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </>
            ) : (
              <>
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </>
            )}
          </svg>
          <div className="space-y-0.5">
            <div className="font-bold">{status.kind === "err" ? "Dispatch Error" : "Call Dispatched Successfully"}</div>
            <div>{status.msg}</div>
          </div>
        </div>
      )}
    </div>
  );
}

