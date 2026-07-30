"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { UploadIcon, DownloadIcon, FileSpreadsheetIcon, AlertCircleIcon } from "lucide-react";

import type { Campaign } from "@voiceplatform/shared";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  campaign: Campaign;
}

const STATUS_CLASSES: Record<Campaign["status"], string> = {
  draft: "text-zinc-500",
  running: "text-emerald-600",
  paused: "text-amber-600",
  done: "text-zinc-400",
};

export function CampaignDetail({ campaign: initial }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [campaign, setCampaign] = useState<Campaign>(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [rejectedDetails, setRejectedDetails] = useState<Array<{ line: number; reason: string }> | null>(null);
  const [replaceOnImport, setReplaceOnImport] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  async function action(path: string, label: string) {
    setBusy(label);
    setError(null);
    try {
      const res = await fetch(`/api/campaigns/${campaign._id}/${path}`, {
        method: "POST",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? `${label} failed (${res.status})`);
        return;
      }
      if (body && body._id) {
        setCampaign(body as Campaign);
      } else {
        const refreshed = await fetch(`/api/campaigns/${campaign._id}`);
        if (refreshed.ok) {
          setCampaign((await refreshed.json()) as Campaign);
        }
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : `${label} failed`);
    } finally {
      setBusy(null);
    }
  }

  function downloadSampleCsv() {
    const sampleData = `phone,name,email,company,notes
+919876543210,Rahul Sharma,rahul@example.com,Acme Corp,Follow up regarding loan
+919876543211,Priya Patel,priya@example.com,Global Tech,Interested in personal loan
+14155552671,John Smith,john@example.com,Beta Inc,VIP customer`;

    const blob = new Blob([sampleData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample_campaign_leads.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFileName(file.name);
    setBusy("import");
    setError(null);
    setImportMsg(null);
    setRejectedDetails(null);
    try {
      const csvText = await file.text();
      const res = await fetch(
        `/api/campaigns/${campaign._id}/numbers/import`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ csvText, replace: replaceOnImport }),
        },
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? `Import failed (${res.status})`);
        return;
      }

      const rejectedCount = Array.isArray(body.rejected)
        ? body.rejected.length
        : (body.rejectedCount ?? 0);

      setImportMsg(
        `Imported ${body.imported} number(s). Rejected ${rejectedCount}. Total: ${body.total}.`,
      );

      if (Array.isArray(body.rejected) && body.rejected.length > 0) {
        setRejectedDetails(body.rejected);
      }

      const refreshed = await fetch(`/api/campaigns/${campaign._id}`);
      if (refreshed.ok) {
        setCampaign((await refreshed.json()) as Campaign);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setBusy(null);
      e.target.value = "";
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete campaign "${campaign.name}"? This cannot be undone.`))
      return;
    setBusy("delete");
    setError(null);
    try {
      const res = await fetch(`/api/campaigns/${campaign._id}`, {
        method: "DELETE",
      });
      if (res.status === 204) {
        router.replace("/campaigns");
        router.refresh();
        return;
      }
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? `Delete failed (${res.status})`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(null);
    }
  }

  const isRunning = campaign.status === "running";
  const isPaused = campaign.status === "paused";
  const canStart = !isRunning && campaign.numbers.length > 0 && Boolean(campaign.fromDid);

  return (
    <div className="mt-3">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">{campaign.name}</h1>
          <p className="text-sm text-zinc-500">
            Status:{" "}
            <span className={`font-medium ${STATUS_CLASSES[campaign.status]}`}>
              {campaign.status}
            </span>
            {" · From "}
            <span className="font-mono text-xs">{campaign.fromDid ?? "—"}</span>
            {" · Pacing "}
            {campaign.schedule.pacingCallsPerMinute}/min
          </p>
        </div>
        <div className="flex gap-2">
          {!isRunning && (
            <Button
              onClick={() => action("start", "start")}
              disabled={!canStart || busy !== null}
            >
              {busy === "start" ? "Starting…" : isPaused ? "Resume" : "Start"}
            </Button>
          )}
          {isRunning && (
            <>
              <Button
                variant="secondary"
                onClick={() => action("pause", "pause")}
                disabled={busy !== null}
              >
                {busy === "pause" ? "Pausing…" : "Pause"}
              </Button>
              <Button
                variant="outline"
                onClick={() => action("dial-now", "dial-now")}
                disabled={busy !== null}
              >
                {busy === "dial-now" ? "Dialing…" : "Dial one"}
              </Button>
            </>
          )}
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={busy !== null}
          >
            Delete
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Stat label="Total" value={campaign.stats.total} />
        <Stat label="Dialed" value={campaign.stats.dialed} />
        <Stat label="Connected" value={campaign.stats.connected} />
        <Stat
          label="Failed"
          value={campaign.stats.failed}
          tone={campaign.stats.failed > 0 ? "warn" : undefined}
        />
      </div>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <FileSpreadsheetIcon className="h-5 w-5 text-emerald-600" />
            Numbers & Lead Import
          </CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={downloadSampleCsv}
            className="flex items-center gap-1.5 text-xs text-zinc-700 hover:text-zinc-900 border-zinc-300"
          >
            <DownloadIcon className="h-3.5 w-3.5 text-emerald-600" />
            Download Sample CSV
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-zinc-600">
            Upload a CSV. The first column must be the phone number (E.164 preferred). Extra columns are passed through as <code>customData</code>.
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-1">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={busy !== null || isRunning}
                className="flex items-center gap-2 cursor-pointer font-medium border border-zinc-200 shadow-sm"
              >
                <UploadIcon className="h-4 w-4 text-emerald-600" />
                {busy === "import" ? "Uploading..." : "Choose CSV File"}
              </Button>

              <span className="text-sm text-zinc-500 font-mono truncate max-w-[220px]">
                {selectedFileName ? selectedFileName : "No file chosen"}
              </span>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleImport}
                disabled={busy !== null || isRunning}
                className="hidden"
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-zinc-600 cursor-pointer sm:ml-auto">
              <input
                type="checkbox"
                checked={replaceOnImport}
                onChange={(e) => setReplaceOnImport(e.target.checked)}
                className="rounded border-zinc-300"
              />
              Replace existing numbers (default appends)
            </label>
          </div>

          {isRunning && (
            <p className="text-xs text-amber-600 flex items-center gap-1">
              <AlertCircleIcon className="h-3.5 w-3.5" />
              Pause the campaign before importing more numbers.
            </p>
          )}

          {importMsg && (
            <p className="text-sm font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 rounded px-3 py-2">
              {importMsg}
            </p>
          )}

          {rejectedDetails && rejectedDetails.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 space-y-1">
              <p className="font-semibold flex items-center gap-1">
                <AlertCircleIcon className="h-3.5 w-3.5" />
                Rejected Row Details:
              </p>
              <ul className="list-disc list-inside space-y-0.5 max-h-32 overflow-y-auto">
                {rejectedDetails.map((item, idx) => (
                  <li key={idx}>
                    Line {item.line}: {item.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-2 text-sm text-zinc-700 flex items-center justify-between border-t border-zinc-100">
            <span>
              Cursor at row <strong>{campaign.cursor}</strong> / {campaign.numbers.length}
            </span>
          </div>

          {campaign.numbers.length > 0 && (
            <div className="mt-4 border rounded-md overflow-hidden">
              <div className="bg-zinc-50 px-4 py-2 border-b text-xs font-semibold text-zinc-600 flex justify-between items-center">
                <span>Imported Leads Preview ({campaign.numbers.length})</span>
              </div>
              <div className="max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-100/70 text-zinc-500 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 w-12">#</th>
                      <th className="px-4 py-2 font-medium">Phone Number</th>
                      <th className="px-4 py-2 font-medium">Custom Data</th>
                      <th className="px-4 py-2 font-medium w-24">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {campaign.numbers.map((num, idx) => {
                      const isDone = idx < campaign.cursor;
                      const isNext = idx === campaign.cursor;
                      return (
                        <tr key={idx} className={isNext ? "bg-emerald-50/50" : "hover:bg-zinc-50/50"}>
                          <td className="px-4 py-2 text-zinc-400 font-mono">{idx + 1}</td>
                          <td className="px-4 py-2 font-mono font-medium text-zinc-800">{num.phone}</td>
                          <td className="px-4 py-2 text-zinc-600">
                            {num.customData && Object.keys(num.customData).length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(num.customData).map(([k, v]) => (
                                  <span key={k} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
                                    {k}: {String(v)}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-zinc-400 italic">—</span>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            {isDone ? (
                              <span className="inline-block px-1.5 py-0.5 text-[10px] font-medium bg-zinc-100 text-zinc-500 rounded">
                                Dialed
                              </span>
                            ) : isNext ? (
                              <span className="inline-block px-1.5 py-0.5 text-[10px] font-medium bg-emerald-100 text-emerald-700 rounded">
                                Next
                              </span>
                            ) : (
                              <span className="inline-block px-1.5 py-0.5 text-[10px] font-medium bg-zinc-50 text-zinc-400 rounded">
                                Pending
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "warn";
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-normal text-zinc-500">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent
        className={`text-2xl font-semibold ${tone === "warn" ? "text-amber-600" : ""}`}
      >
        {value}
      </CardContent>
    </Card>
  );
}
