"use client";

import React, { useState } from "react";
import type { Call, Transcript, TranscriptTurn } from "@voiceplatform/shared";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CallsTableProps {
  initialCalls: Call[];
}

const STATUS_CONFIG: Record<Call["status"], { label: string; cls: string }> = {
  queued: { label: "Queued", cls: "badge-muted" },
  ringing: { label: "Ringing", cls: "badge-blue" },
  inprogress: { label: "In Progress", cls: "badge-green" },
  completed: { label: "Completed", cls: "badge-muted" },
  failed: { label: "Failed", cls: "badge-red" },
};

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

export function CallsTable({ initialCalls }: CallsTableProps) {
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [selectedCall, setSelectedCall] = useState<(Call & { transcript?: Transcript | null }) | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  console.log('......selectedCall.....', JSON.stringify(selectedCall))
  const handleRowClick = async (callId: string) => {
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
  };

  const handleClose = () => {
    setSelectedCallId(null);
    setSelectedCall(null);
  };

  return (
    <>
      <div className="glass-card rounded-2xl overflow-hidden">
        <table className="w-full text-sm" id="calls-table">
          <thead>
            <tr
              className="border-b border-[var(--c-border)]"
              style={{ background: "var(--c-table-head)" }}
            >
              {(["When", "Direction", "From", "To", "Status", "Duration", "Cost"] as const).map((h, i) => (
                <th
                  key={h}
                  className={`px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-[var(--c-text-dim)] whitespace-nowrap ${i >= 5 ? "text-right" : "text-left"}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {initialCalls.map((c) => {
              const { date, time } = formatDate(c.createdAt);
              const statusCfg =
                STATUS_CONFIG[c.status] ?? { label: c.status, cls: "badge-muted" };

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
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={selectedCallId !== null} onOpenChange={(open) => { if (!open) handleClose(); }}>
        <DialogContent className="sm:max-w-4xl max-w-full w-full h-[85vh] flex flex-col p-6 rounded-2xl bg-card border border-[var(--c-border)] gap-0 overflow-hidden shadow-2xl">
          <DialogHeader className="border-b pb-4 border-[var(--c-border)] select-none">
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
