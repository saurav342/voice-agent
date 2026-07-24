"use client";

import { useState } from "react";

type Status = { kind: "idle" | "calling" | "ok" | "err"; msg?: string };

export function PlaceCall() {
  const [number, setNumber] = useState("9353096061");
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
    <div className="glass-card rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-xl icon-gradient-violet flex items-center justify-center shrink-0"
          style={{ boxShadow: "0 4px 14px oklch(0.55 0.28 275 / 0.25)" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z" />
          </svg>
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">Quick Dial</h2>
          <p className="text-xs text-[var(--c-text-secondary)]">
            Dispatch an AI agent call to any number instantly
          </p>
        </div>
      </div>

      <div className="h-px bg-[var(--c-border)] mb-5" />

      <p className="text-sm text-[var(--c-text-secondary)] mb-4">
        Enter a number and the Vaani AI agent will call it. For India, enter the 10-digit number (e.g. 9307512816).
      </p>

      <div className="flex gap-3 max-w-lg">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--c-text-dim)]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
            className="w-full h-11 pl-9 pr-4 rounded-xl text-sm border text-foreground focus:outline-none focus:ring-2 transition-smooth"
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
          className="h-11 px-6 rounded-xl text-sm font-semibold text-white transition-smooth disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            background:
              status.kind === "calling"
                ? "oklch(0.48 0.22 275)"
                : "linear-gradient(135deg, oklch(0.55 0.28 275), oklch(0.50 0.25 240))",
            boxShadow:
              status.kind === "calling"
                ? "none"
                : "0 4px 16px oklch(0.55 0.28 275 / 0.28)",
          }}
        >
          {status.kind === "calling" ? (
            <span className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" aria-hidden="true" />
              Calling…
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z" />
              </svg>
              Call Now
            </span>
          )}
        </button>
      </div>

      {status.msg && (
        <div
          className="mt-4 flex items-start gap-2.5 rounded-xl p-3.5 text-sm"
          style={
            status.kind === "err"
              ? {
                background: "oklch(0.52 0.22 24 / 0.07)",
                border: "1px solid oklch(0.52 0.22 24 / 0.18)",
                color: "var(--accent-red)",
              }
              : {
                background: "oklch(0.52 0.18 158 / 0.07)",
                border: "1px solid oklch(0.52 0.18 158 / 0.18)",
                color: "var(--accent-green)",
              }
          }
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0" aria-hidden="true">
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
          {status.msg}
        </div>
      )}
    </div>
  );
}
