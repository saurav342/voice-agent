"use client";

import React, { useState, useMemo, useCallback } from "react";
import type { Call, Transcript, TranscriptTurn } from "@voiceplatform/shared";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/* ═══════════════════════════════════════════════════════════════════════════
   Types & Constants
   ═══════════════════════════════════════════════════════════════════════════ */

interface CallsTableProps {
  initialCalls: Call[];
}

type DatePreset = "all" | "today" | "this_week" | "last_week" | "this_month" | "last_month" | "custom";

interface DateRange {
  from: Date | null;
  to: Date | null;
}

const STATUS_CONFIG: Record<Call["status"], { label: string; cls: string }> = {
  queued: { label: "Queued", cls: "badge-muted" },
  ringing: { label: "Ringing", cls: "badge-blue" },
  inprogress: { label: "In Progress", cls: "badge-green" },
  completed: { label: "Completed", cls: "badge-muted" },
  failed: { label: "Failed", cls: "badge-red" },
};

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "this_week", label: "This Week" },
  { value: "last_week", label: "Last Week" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "custom", label: "Custom" },
];

/* ═══════════════════════════════════════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════════════════════════════════════ */

function formatDuration(seconds: number): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatDate(iso: Date): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    time: d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
  };
}

function getPresetRange(preset: DatePreset): DateRange {
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

  switch (preset) {
    case "today":
      return { from: startOfDay(now), to: endOfDay(now) };
    case "this_week": {
      const day = now.getDay();
      const diff = day === 0 ? 6 : day - 1; // Monday start
      const monday = new Date(now);
      monday.setDate(now.getDate() - diff);
      return { from: startOfDay(monday), to: endOfDay(now) };
    }
    case "last_week": {
      const day = now.getDay();
      const diff = day === 0 ? 6 : day - 1;
      const thisMonday = new Date(now);
      thisMonday.setDate(now.getDate() - diff);
      const lastMonday = new Date(thisMonday);
      lastMonday.setDate(thisMonday.getDate() - 7);
      const lastSunday = new Date(thisMonday);
      lastSunday.setDate(thisMonday.getDate() - 1);
      return { from: startOfDay(lastMonday), to: endOfDay(lastSunday) };
    }
    case "this_month":
      return {
        from: new Date(now.getFullYear(), now.getMonth(), 1),
        to: endOfDay(now),
      };
    case "last_month": {
      const firstLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: firstLastMonth, to: endOfDay(lastDayLastMonth) };
    }
    default:
      return { from: null, to: null };
  }
}

function needsAttention(sentiment: string): boolean {
  return sentiment == "positive";
}

async function exportToExcel(calls: Call[]) {
  const XLSX = await import("xlsx");

  const rows = calls.map((c) => ({
    "Date": new Date(c.createdAt).toLocaleString(),
    "Direction": c.direction === "out" ? "Outbound" : "Inbound",
    "From": c.fromNumber,
    "To": c.toNumber,
    "Status": STATUS_CONFIG[c.status]?.label ?? c.status,
    "Duration": formatDuration(c.durationSec),
    "Cost (Credits)": c.costCredits || 0,
    "Sentiment": c.sentiment,
    "Needs Attention": needsAttention(c.sentiment) ? "Yes" : "No",
  }));

  const ws = XLSX.utils.json_to_sheet(rows);

  /* Column widths */
  ws["!cols"] = [
    { wch: 22 }, // Date
    { wch: 10 }, // Direction
    { wch: 16 }, // From
    { wch: 16 }, // To
    { wch: 12 }, // Status
    { wch: 10 }, // Duration
    { wch: 14 }, // Cost
    { wch: 10 }, // Sentiment
    { wch: 16 }, // Needs Attention
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Calls");
  XLSX.writeFile(wb, `calls_export_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/* ═══════════════════════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════════════════════ */

export function CallsTable({ initialCalls }: CallsTableProps) {
  const [callsList, setCallsList] = useState<Call[]>(initialCalls);
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [selectedCall, setSelectedCall] = useState<(Call & { transcript?: Transcript | null }) | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activePreset, setActivePreset] = useState<DatePreset>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [attentionFilter, setAttentionFilter] = useState<"all" | "yes" | "no">("all");
  const [directionFilter, setDirectionFilter] = useState<"all" | "in" | "out">("all");
  const [statusFilter, setStatusFilter] = useState<Set<Call["status"]>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  React.useEffect(() => {
    setCallsList(initialCalls);
  }, [initialCalls]);

  const handleKillCall = useCallback(async (callId: string) => {
    try {
      const res = await fetch(`/api/calls/${callId}/kill`, { method: "POST" });
      if (res.ok) {
        setCallsList((prev) =>
          prev.map((c) =>
            c._id === callId ? { ...c, status: "completed" as const } : c
          )
        );
        setSelectedCall((prev) => (prev && prev._id === callId ? { ...prev, status: "completed" as const } : prev));
      }
    } catch (err) {
      console.error("Failed to kill call:", err);
    }
  }, []);

  /* ── Active filter count (for badge / clear-all visibility) ── */
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (activePreset !== "all") count++;
    if (attentionFilter !== "all") count++;
    if (directionFilter !== "all") count++;
    if (statusFilter.size > 0) count++;
    if (searchQuery.trim() !== "") count++;
    return count;
  }, [activePreset, attentionFilter, directionFilter, statusFilter, searchQuery]);

  const clearAllFilters = useCallback(() => {
    setActivePreset("all");
    setCustomFrom("");
    setCustomTo("");
    setAttentionFilter("all");
    setDirectionFilter("all");
    setStatusFilter(new Set());
    setSearchQuery("");
  }, []);

  /* ── Filtered calls ─────────────────────────────────────────── */
  const filteredCalls = useMemo(() => {
    let range: DateRange = { from: null, to: null };
    if (activePreset !== "all") {
      if (activePreset === "custom") {
        range = {
          from: customFrom ? new Date(customFrom) : null,
          to: customTo ? new Date(customTo + "T23:59:59.999") : null,
        };
      } else {
        range = getPresetRange(activePreset);
      }
    }

    const q = searchQuery.trim().toLowerCase();

    return callsList.filter((c) => {
      // Date filter
      if (activePreset !== "all") {
        const created = new Date(c.createdAt);
        if (range.from && created < range.from) return false;
        if (range.to && created > range.to) return false;
      }
      // Attention filter
      if (attentionFilter === "yes" && !needsAttention(c.sentiment)) return false;
      if (attentionFilter === "no" && needsAttention(c.sentiment)) return false;
      // Direction filter
      if (directionFilter !== "all" && c.direction !== directionFilter) return false;
      // Status filter
      if (statusFilter.size > 0 && !statusFilter.has(c.status)) return false;
      // Phone number search
      if (q && !c.fromNumber.toLowerCase().includes(q) && !c.toNumber.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [callsList, activePreset, customFrom, customTo, attentionFilter, directionFilter, statusFilter, searchQuery]);

  /* ── Handlers ───────────────────────────────────────────────── */
  const handleRowClick = useCallback(async (callId: string) => {
    setSelectedCallId(callId);
    setLoadingDetails(true);
    try {
      const res = await fetch(`/api/calls/${callId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedCall(data);
      }
    } catch (err) {
      console.error("Failed to fetch call details:", err);
    } finally {
      setLoadingDetails(false);
    }
  }, []);

  const handleClose = useCallback(() => {
    setSelectedCallId(null);
    setSelectedCall(null);
  }, []);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      await exportToExcel(filteredCalls);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setIsExporting(false);
    }
  }, [filteredCalls]);

  return (
    <>
      {/* ── Filter & Export Bar ────────────────────────────────── */}
      <div className="glass-card rounded-2xl p-4 mb-4 animate-fade-up" id="calls-filter-bar">
        {/* Row 1: Date presets + Search + Export */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Date preset pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--c-text-dim)] mr-1.5 select-none">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline -mt-0.5 mr-1" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Filter
            </span>
            {DATE_PRESETS.map((p) => (
              <button
                key={p.value}
                id={`filter-${p.value}`}
                onClick={() => setActivePreset(p.value)}
                className={`
                  px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer select-none whitespace-nowrap
                  ${activePreset === p.value
                    ? "bg-[var(--brand)] text-white shadow-md shadow-[var(--brand-glow)]"
                    : "bg-[var(--c-overlay-sm)] text-[var(--c-text-secondary)] hover:bg-[var(--c-overlay-md)] hover:text-foreground"
                  }
                `}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* Search by phone number */}
            <div className="relative">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--c-text-dim)]" aria-hidden="true">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                id="search-phone"
                type="text"
                placeholder="Search phone…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="
                  pl-9 pr-8 py-1.5 rounded-full text-xs bg-[var(--c-input-bg)] border border-[var(--c-border)]
                  text-foreground placeholder:text-[var(--c-text-dim)]
                  focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent
                  transition-all duration-150 w-40
                "
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--c-text-dim)] hover:text-foreground transition-colors cursor-pointer"
                  aria-label="Clear search"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>

            {/* Download button */}
            <button
              id="export-excel-btn"
              onClick={handleExport}
              disabled={isExporting || filteredCalls.length === 0}
              className="
                inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold
                bg-gradient-to-r from-emerald-600 to-teal-600 text-white
                shadow-md shadow-emerald-500/20
                hover:shadow-lg hover:shadow-emerald-500/30 hover:from-emerald-500 hover:to-teal-500
                disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none
                transition-all duration-200 cursor-pointer select-none whitespace-nowrap
              "
            >
              {isExporting ? (
                <>
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Exporting…
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download Excel
                  {filteredCalls.length > 0 && (
                    <span className="bg-white/20 px-1.5 py-0.5 rounded-md text-[10px]">
                      {filteredCalls.length}
                    </span>
                  )}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Custom date inputs */}
        {activePreset === "custom" && (
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[var(--c-border)] animate-fade-up">
            <label className="text-xs text-[var(--c-text-secondary)] font-medium select-none">From</label>
            <input
              id="custom-from-date"
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="
                px-3 py-1.5 rounded-lg text-xs bg-[var(--c-input-bg)] border border-[var(--c-border)]
                text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent
                transition-all duration-150
              "
            />
            <label className="text-xs text-[var(--c-text-secondary)] font-medium select-none">To</label>
            <input
              id="custom-to-date"
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="
                px-3 py-1.5 rounded-lg text-xs bg-[var(--c-input-bg)] border border-[var(--c-border)]
                text-foreground focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent
                transition-all duration-150
              "
            />
          </div>
        )}

        {/* Row 2: Compact filter dropdowns + active chip strip */}
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[var(--c-border)]">
          {/* Direction select */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="filter-direction" className="text-[11px] font-semibold uppercase tracking-wider text-[var(--c-text-dim)] select-none whitespace-nowrap">Direction</label>
            <select
              id="filter-direction"
              value={directionFilter}
              onChange={(e) => setDirectionFilter(e.target.value as "all" | "in" | "out")}
              className="
                px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[var(--c-input-bg)] border border-[var(--c-border)]
                text-foreground cursor-pointer
                focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent
                transition-all duration-150 appearance-none
                bg-[length:16px_16px] bg-[right_6px_center] bg-no-repeat
              "
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%2399a1af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m4 6 4 4 4-4'/%3E%3C/svg%3E")`, paddingRight: '26px' }}
            >
              <option value="all">All</option>
              <option value="in">↙ Inbound</option>
              <option value="out">↗ Outbound</option>
            </select>
          </div>

          {/* Status select */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="filter-status" className="text-[11px] font-semibold uppercase tracking-wider text-[var(--c-text-dim)] select-none whitespace-nowrap">Status</label>
            <div className="flex items-center gap-1">
              {(["completed", "ringing", "inprogress", "failed", "queued"] as Call["status"][]).map((s) => {
                const cfg = STATUS_CONFIG[s];
                const isActive = statusFilter.has(s);
                const colorMap: Record<string, string> = {
                  failed: "bg-red-500 text-white shadow-sm shadow-red-500/25",
                  inprogress: "bg-emerald-600 text-white shadow-sm shadow-emerald-500/25",
                  ringing: "bg-blue-500 text-white shadow-sm shadow-blue-500/25",
                  completed: "bg-neutral-600 text-white shadow-sm shadow-neutral-500/20",
                  queued: "bg-neutral-500 text-white shadow-sm shadow-neutral-400/20",
                };
                return (
                  <button
                    key={`status-${s}`}
                    id={`filter-status-${s}`}
                    onClick={() => {
                      setStatusFilter((prev) => {
                        const next = new Set(prev);
                        if (next.has(s)) next.delete(s);
                        else next.add(s);
                        return next;
                      });
                    }}
                    className={`
                      px-2 py-1 rounded-md text-[11px] font-medium transition-all duration-200 cursor-pointer select-none whitespace-nowrap
                      ${isActive
                        ? colorMap[s] || "bg-[var(--brand)] text-white"
                        : "bg-[var(--c-overlay-sm)] text-[var(--c-text-secondary)] hover:bg-[var(--c-overlay-md)] hover:text-foreground"
                      }
                    `}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Attention select */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="filter-attention" className="text-[11px] font-semibold uppercase tracking-wider text-[var(--c-text-dim)] select-none whitespace-nowrap">Attention</label>
            <select
              id="filter-attention"
              value={attentionFilter}
              onChange={(e) => setAttentionFilter(e.target.value as "all" | "yes" | "no")}
              className="
                px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[var(--c-input-bg)] border border-[var(--c-border)]
                text-foreground cursor-pointer
                focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:border-transparent
                transition-all duration-150 appearance-none
                bg-[length:16px_16px] bg-[right_6px_center] bg-no-repeat
              "
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%2399a1af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m4 6 4 4 4-4'/%3E%3C/svg%3E")`, paddingRight: '26px' }}
            >
              <option value="all">All</option>
              <option value="yes">⚠ Yes</option>
              <option value="no">✓ No</option>
            </select>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Clear all */}
          {activeFilterCount > 0 && (
            <button
              id="clear-all-filters"
              onClick={clearAllFilters}
              className="
                inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium
                text-red-400 hover:text-red-300 hover:bg-red-500/10
                transition-all duration-200 cursor-pointer select-none whitespace-nowrap
              "
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* ── Calls Table ───────────────────────────────────────── */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <table className="w-full text-sm" id="calls-table">
          <thead>
            <tr
              className="border-b border-[var(--c-border)]"
              style={{ background: "var(--c-table-head)" }}
            >
              {(["When", "Direction", "From", "To", "Status", "Needs Attention", "Duration", "Cost", "Actions"] as const).map((h, i) => (
                <th
                  key={h}
                  className={`px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--c-text-dim)] whitespace-nowrap ${i >= 6 ? "text-right" : "text-left"}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredCalls.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-5 py-12 text-center text-sm text-[var(--c-text-secondary)]">
                  <div className="flex flex-col items-center gap-2">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--c-text-dim)]">
                      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    No calls found for this date range
                  </div>
                </td>
              </tr>
            ) : (
              filteredCalls.map((c) => {
                const { date, time } = formatDate(c.createdAt);
                const statusCfg =
                  STATUS_CONFIG[c.status] ?? { label: c.status, cls: "badge-muted" };
                const attention = needsAttention(c.sentiment);
                const isActive = c.status === "inprogress" || c.status === "ringing" || c.status === "queued";

                return (
                  <tr
                    key={c._id}
                    onClick={() => handleRowClick(c._id)}
                    className="cursor-pointer border-b border-[var(--c-border)] last:border-0 hover:bg-[var(--c-row-hover)] transition-colors duration-150"
                  >
                    {/* When */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-foreground">{date}</div>
                      <div className="text-xs text-[var(--c-text-secondary)]">{time}</div>
                    </td>

                    {/* Direction */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      {c.direction === "out" ? (
                        <span className="badge badge-purple">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" />
                          </svg>
                          Outbound
                        </span>
                      ) : (
                        <span className="badge badge-green">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <line x1="17" y1="7" x2="7" y2="17" /><polyline points="17 17 7 17 7 7" />
                          </svg>
                          Inbound
                        </span>
                      )}
                    </td>

                    {/* From */}
                    <td className="px-5 py-4 font-mono text-xs text-[var(--c-text-secondary)] whitespace-nowrap">
                      {c.fromNumber}
                    </td>

                    {/* To */}
                    <td className="px-5 py-4 font-mono text-xs text-[var(--c-text-secondary)] whitespace-nowrap">
                      {c.toNumber}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`badge ${statusCfg.cls}`}>
                        {c.status === "inprogress" && (
                          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse inline-block mr-1" />
                        )}
                        {statusCfg.label}
                      </span>
                    </td>

                    {/* Needs Attention */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      {attention ? (
                        <span className="badge badge-red">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                          </svg>
                          Yes
                        </span>
                      ) : (
                        <span className="badge badge-green">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          No
                        </span>
                      )}
                    </td>

                    {/* Duration */}
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 text-[var(--c-text-secondary)] justify-end">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                        </svg>
                        {formatDuration(c.durationSec)}
                      </span>
                    </td>

                    {/* Cost */}
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      {c.costCredits ? (
                        <span className="inline-flex items-center gap-1 text-[var(--c-text-secondary)] justify-end">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                          </svg>
                          {c.costCredits}
                        </span>
                      ) : (
                        <span className="text-[var(--c-text-dim)]">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      {isActive ? (
                        <button
                          id={`kill-call-btn-${c._id}`}
                          onClick={async (e) => {
                            e.stopPropagation();
                            await handleKillCall(c._id);
                          }}
                          title="Immediately terminate this active call"
                          className="px-2.5 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-lg transition-all flex items-center gap-1 shadow-sm ml-auto animate-pulse"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
                            <line x1="22" y1="2" x2="2" y2="22" />
                          </svg>
                          Kill Call
                        </button>
                      ) : (
                        <span className="text-[var(--c-text-dim)] text-xs">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Call Detail Dialog ─────────────────────────────────── */}
      <Dialog open={selectedCallId !== null} onOpenChange={(open) => { if (!open) handleClose(); }}>
        <DialogContent className="sm:max-w-4xl max-w-full w-full h-[85vh] flex flex-col p-6 rounded-2xl bg-card border border-[var(--c-border)] gap-0 overflow-hidden shadow-2xl">
          <DialogHeader className="border-b pb-4 border-[var(--c-border)] select-none flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-3">
                <span>Call Details</span>
                {selectedCall && (
                  <span className={`badge ${STATUS_CONFIG[selectedCall.status]?.cls || "badge-muted"}`}>
                    {STATUS_CONFIG[selectedCall.status]?.label || selectedCall.status}
                  </span>
                )}
              </DialogTitle>
              <DialogDescription className="text-xs text-[var(--c-text-secondary)] mt-1">
                {selectedCall ? `Call ID: ${selectedCall._id}` : "Loading call detail..."}
              </DialogDescription>
            </div>
            {selectedCall && (selectedCall.status === "inprogress" || selectedCall.status === "ringing" || selectedCall.status === "queued") && (
              <button
                onClick={() => handleKillCall(selectedCall._id)}
                className="px-3.5 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-rose-600/30 mr-6"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" />
                  <line x1="22" y1="2" x2="2" y2="22" />
                </svg>
                Kill Call
              </button>
            )}
          </DialogHeader>

          {loadingDetails ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 p-12">
              <div className="w-8 h-8 rounded-full border-2 border-[var(--c-border)] border-t-[var(--brand)] animate-spin" />
              <p className="text-sm text-[var(--c-text-secondary)] font-medium">Fetching details & transcripts...</p>
            </div>
          ) : selectedCall ? (
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
              {/* Left Column: Metadata & Audio */}
              <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-[var(--c-border)] p-4 flex flex-col gap-5 overflow-y-auto select-none shrink-0 bg-muted/20">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--c-text-dim)]">Call Summary</h4>
                  <div className="mt-3 space-y-3.5">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[var(--c-text-secondary)]">Direction</span>
                      <span className="font-semibold text-foreground capitalize">
                        {selectedCall.direction === "out" ? "Outbound" : "Inbound"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[var(--c-text-secondary)]">From</span>
                      <span className="font-mono text-xs text-foreground bg-[var(--c-overlay-xs)] px-2 py-0.5 rounded border border-[var(--c-border)]">
                        {selectedCall.fromNumber}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[var(--c-text-secondary)]">To</span>
                      <span className="font-mono text-xs text-foreground bg-[var(--c-overlay-xs)] px-2 py-0.5 rounded border border-[var(--c-border)]">
                        {selectedCall.toNumber}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[var(--c-text-secondary)]">Duration</span>
                      <span className="font-semibold text-foreground">{formatDuration(selectedCall.durationSec)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[var(--c-text-secondary)]">Cost</span>
                      <span className="font-semibold text-foreground flex items-center gap-0.5">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="text-amber-500">
                          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                        </svg>
                        {selectedCall.costCredits || 0} Credits
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[var(--c-text-secondary)]">Sentiment</span>
                      <span className="capitalize font-semibold text-foreground flex items-center gap-1.5">
                        {selectedCall.sentiment === "positive" && <span className="w-2 h-2 rounded-full bg-emerald-500" />}
                        {selectedCall.sentiment === "negative" && <span className="w-2 h-2 rounded-full bg-red-500" />}
                        {selectedCall.sentiment === "neutral" && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                        {selectedCall.sentiment === "unknown" && <span className="w-2 h-2 rounded-full bg-neutral-400" />}
                        {selectedCall.sentiment}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[var(--c-text-secondary)]">Needs Attention</span>
                      <span>
                        {needsAttention(selectedCall.sentiment) ? (
                          <span className="badge badge-red text-xs">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                            Yes
                          </span>
                        ) : (
                          <span className="badge badge-green text-xs">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            No
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[var(--c-text-secondary)]">Created At</span>
                      <span className="text-xs text-foreground font-medium">
                        {new Date(selectedCall.createdAt).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedCall.transcript?.summary && (
                  <div className="border-t pt-4 border-[var(--c-border)]">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--c-text-dim)] mb-2">AI Summary</h4>
                    <p className="text-xs text-foreground bg-[var(--c-section-bg)] p-3 rounded-xl border border-[var(--c-border)] leading-relaxed">
                      {selectedCall.transcript.summary}
                    </p>
                  </div>
                )}

                {selectedCall.recordingUrl && (
                  <div className="border-t pt-4 border-[var(--c-border)]">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--c-text-dim)] mb-3">Call Recording</h4>
                    <div className="p-3 bg-[var(--c-section-bg)] rounded-xl border border-[var(--c-border)]">
                      <audio src={selectedCall.recordingUrl} controls className="w-full h-8 outline-none" />
                      <div className="mt-2 text-[10px] text-center text-[var(--c-text-dim)]">
                        <a href={selectedCall.recordingUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          Download raw recording audio
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Transcription Turns */}
              <div className="flex-1 flex flex-col overflow-hidden min-h-0 bg-background/40">
                <div className="px-5 py-3.5 border-b border-[var(--c-border)] bg-card select-none">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--c-text-dim)]">Conversation Transcript</h4>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {selectedCall.transcript?.turns && selectedCall.transcript.turns.length > 0 ? (
                    selectedCall.transcript.turns.map((turn: TranscriptTurn, i: number) => {
                      const isUser = turn.role === "user";
                      return (
                        <div
                          key={i}
                          className={`flex flex-col max-w-[85%] ${isUser ? "ml-auto items-end" : "mr-auto items-start"}`}
                        >
                          <span className="text-[10px] text-[var(--c-text-secondary)] mb-1 px-1 capitalize">
                            {turn.role}
                          </span>
                          <div
                            className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${isUser
                              ? "bg-[var(--brand)] text-primary-foreground rounded-tr-none shadow-md"
                              : "bg-secondary text-secondary-foreground rounded-tl-none border border-[var(--c-border)] shadow-xs"
                              }`}
                          >
                            {turn.text}
                          </div>
                          {turn.ms !== undefined && (
                            <span className="text-[9px] text-[var(--c-text-dim)] mt-1 px-1 select-none">
                              {formatDuration(Math.round(turn.ms / 1000))}
                            </span>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 gap-3 select-none">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-[var(--c-text-secondary)]">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                      </div>
                      <div>
                        <h5 className="text-sm font-semibold text-foreground">No transcript available</h5>
                        <p className="text-xs text-[var(--c-text-secondary)] mt-1 max-w-xs">
                          Transcripts are generated in real-time as the call progresses. This call might have finished before speech began or has not been logged.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-12 text-sm text-[var(--c-text-secondary)]">
              No call selected.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
