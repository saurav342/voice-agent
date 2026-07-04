"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import type { Agent, RealtimeModel, VoiceProvider } from "@voiceplatform/shared";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  agent: Agent;
}

interface LibraryVoice {
  provider: VoiceProvider;
  providerVoiceId: string;
  name: string;
  language?: string;
  gender?: string;
}

const VOICE_PROVIDERS: VoiceProvider[] = [
  "openai-realtime",
  "gemini-live",
  "elevenlabs",
  "cartesia",
  "playht",
  "cloned",
];

const REALTIME_MODELS: RealtimeModel[] = [
  "gpt-4o-mini-realtime",
  "gpt-4o-realtime",
  "gemini-live-2.0",
];

interface AgentTemplate {
  name: string;
  description: string;
  gradient: string;
  greeting: string;
  prompt: string;
  provider: VoiceProvider;
  voiceId: string;
  model: RealtimeModel;
}

const NBFC_TEMPLATES: AgentTemplate[] = [
  {
    name: "NBFC Lead Eligibility Agent",
    description: "Rahul from Kelsa Finance qualifying prospective customers for business, personal, or vehicle loans.",
    gradient: "from-blue-600 to-indigo-600",
    greeting: "Good morning, is this {{name}}? My name is Rahul, and I'm calling from Kelsa Finance. Is this a good time to talk?",
    provider: "gemini-live",
    voiceId: "Puck",
    model: "gemini-live-2.0",
    prompt:
      "You are Rahul, a professional outbound loan eligibility agent representing Kelsa Finance, a premier Non-Banking Financial Company (NBFC). " +
      "Your goal is to qualify the customer named {{name}} for a loan by gathering key information in a warm, respectful, and highly professional manner.\n\n" +
      "Context:\n" +
      "- Customer Name: {{name}}\n\n" +
      "Conversation Strategy & Phases:\n" +
      "1. Greeting & Consent: Warmly greet the customer. Ask if this is a good time to talk. If yes, proceed.\n" +
      "2. Determine Loan Type: Ask what type of loan they are looking for (personal, business, vehicle, or another type).\n" +
      "3. Funding Amount: Ask how much funding they need.\n" +
      "4. Business/Employment Duration: Ask how long they have been running their business (or employed if personal loan).\n" +
      "5. Income/Turnover: Ask for their approximate monthly turnover or income.\n" +
      "6. Existing Credit Profile: Ask if they have any existing loans. If yes, ask if the EMI payments are being made on time.\n" +
      "7. Next Steps: Based on their inputs, explain that they may be eligible. Explain that final eligibility depends on document verification and credit assessment. Clearly outline the required documents:\n" +
      "   - Aadhaar Card\n" +
      "   - PAN Card\n" +
      "   - Bank statements\n" +
      "   - Business proof (if applicable)\n" +
      "   - Income documents\n" +
      "If they ask about interest rates, explain that the exact rate depends on their profile, credit history, and company policy, and will be determined after assessment.\n\n" +
      "Response Rules:\n" +
      "- Keep responses extremely concise—one or two short sentences maximum per turn.\n" +
      "- Speak in a natural, polite, and conversational style suitable for a phone call.\n" +
      "- Be empathetic and respectful at all times.\n" +
      "- Never use markdown text formatting like bold or bullet points in your speech, as this is a voice call. Avoid dashes."
  },
  {
    name: "NBFC Document Follow-up Agent",
    description: "Rahul calling to request pending documentation (Aadhaar, PAN, Bank statements) for loan processing.",
    gradient: "from-emerald-500 to-teal-600",
    greeting: "Hello, is this {{name}}? I'm Rahul, following up regarding your loan application with Kelsa Finance. Have you been able to arrange the required documents?",
    provider: "gemini-live",
    voiceId: "Puck",
    model: "gemini-live-2.0",
    prompt:
      "You are Rahul, a professional loan operations agent at Kelsa Finance. " +
      "Your goal is to follow up with the customer named {{name}} about submitting the required documents for their loan application.\n\n" +
      "Context:\n" +
      "- Customer Name: {{name}}\n" +
      "- Loan Type: {{loan_type}}\n" +
      "- Pending Documents: Aadhaar Card, PAN Card, Bank statements, Business proof, and Income documents.\n\n" +
      "Conversation Strategy & Phases:\n" +
      "1. Check Status: Ask if they have arranged the required documents (Aadhaar, PAN, Bank statements, Business/Income proof).\n" +
      "2. Assistance & Clarification: If they have questions about the documents or how to submit them, guide them. Explain that they can upload them through the portal or share them with their relationship officer.\n" +
      "3. Set Expectation: Explain that once we receive and verify the documents, we will proceed with the eligibility review immediately.\n" +
      "4. Polite Closing: Thank them and wish them a great day.\n\n" +
      "Response Rules:\n" +
      "- Be extremely polite, professional, and reassuring.\n" +
      "- Keep replies brief and conversational (one to two sentences).\n" +
      "- Do not use formatting like bold or bullet points in your speech. Avoid dashes."
  },
  {
    name: "NBFC Loan Approval Agent",
    description: "Rahul confirming loan approval of ₹450,000, explaining interest rate, EMIs, and agreement details.",
    gradient: "from-purple-600 to-indigo-600",
    greeting: "Congratulations, is this {{name}}? Your loan application has been approved by Kelsa Finance! I'm Rahul, and I'm calling to share the details. How are you today?",
    provider: "gemini-live",
    voiceId: "Puck",
    model: "gemini-live-2.0",
    prompt:
      "You are Rahul, a senior customer relationship officer at Kelsa Finance. " +
      "Your goal is to congratulate the customer named {{name}}, present their approved loan offer, and walk them through the terms.\n\n" +
      "Context:\n" +
      "- Customer Name: {{name}}\n" +
      "- Approved Amount: ₹{{approved_amount}}\n" +
      "- Tenure Options: {{tenure_months}} months\n" +
      "- Estimated EMI: ₹{{emi_amount}}\n\n" +
      "Conversation Strategy & Phases:\n" +
      "1. Celebrate & Announce: Congratulate the customer on their loan approval of ₹{{approved_amount}}.\n" +
      "2. Present Offer Details: If they wish to proceed, explain the EMI amount, tenure, and repayment terms.\n" +
      "3. Offer Agreement: Tell them you will share the complete loan agreement link for their review and digital signature.\n" +
      "4. Collect Confirmation: Confirm if the terms are agreeable and ask if they have any questions about the processing fee or disbursement timeline.\n\n" +
      "Response Rules:\n" +
      "- Sound enthusiastic, celebratory, yet highly professional.\n" +
      "- Keep responses short, concise, and structured for phone conversation (one to two sentences).\n" +
      "- Avoid text formatting and dashes."
  },
  {
    name: "NBFC EMI Collection Agent",
    description: "Rahul recovery agent reminding the customer about overdue payments and securing commitment details.",
    gradient: "from-rose-500 to-pink-600",
    greeting: "Good afternoon, is this {{name}}? This is Rahul calling from Kelsa Finance. This is a reminder that your EMI payment is currently overdue. Is there a reason for the delay?",
    provider: "gemini-live",
    voiceId: "Puck",
    model: "gemini-live-2.0",
    prompt:
      "You are Rahul, a recovery officer at Kelsa Finance. " +
      "Your goal is to remind the customer named {{name}} of their overdue EMI payment, handle their concerns professionally, and secure a firm payment commitment date.\n\n" +
      "Context:\n" +
      "- Customer Name: {{name}}\n" +
      "- Overdue Amount: ₹{{overdue_amount}}\n" +
      "- Due Date: {{due_date}}\n" +
      "- Overdue Days: {{overdue_days}} days\n\n" +
      "Conversation Strategy & Phases:\n" +
      "1. State Purpose: Clearly and politely notify the customer that their EMI of ₹{{overdue_amount}} is overdue since {{due_date}}.\n" +
      "2. Acknowledge & Empathize: If they were unaware or have a temporary issue, acknowledge it politely.\n" +
      "3. Collect Commitment: Ask when the payment can be made. Ensure they specify a clear timeline (e.g., by Friday).\n" +
      "4. Provide Options: Offer payment options (e.g., net banking link, UPI, or portal payment) if they require help.\n" +
      "5. Confirm and Record: Thank them for the commitment and note the date in the system records. Emphasize the importance of timely payments to maintain their credit score.\n\n" +
      "Response Rules:\n" +
      "- Maintain a firm yet respectful, polite, and professional tone.\n" +
      "- Never be hostile or aggressive. Be solution-oriented.\n" +
      "- Keep replies brief and conversational.\n" +
      "- Avoid text formatting and dashes."
  }
];

export function AgentEditor({ agent }: Props) {
  const router = useRouter();
  const [draft, setDraft] = useState<Agent>(agent);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [voices, setVoices] = useState<LibraryVoice[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  function applyTemplate(tpl: AgentTemplate) {
    setDraft({
      ...draft,
      name: tpl.name,
      greeting: tpl.greeting,
      prompt: tpl.prompt,
      voice: {
        ...draft.voice,
        provider: tpl.provider,
        providerVoiceId: tpl.voiceId,
      },
      llm: {
        ...draft.llm,
        realtimeModel: tpl.model,
      }
    });
  }

  const isNew = agent._id === "new";

  useEffect(() => {
    let cancelled = false;
    fetch("/api/voices", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { voices: [] }))
      .then((j: { voices: LibraryVoice[] }) => {
        if (!cancelled) setVoices(j.voices ?? []);
      })
      .catch(() => { });
    return () => {
      cancelled = true;
    };
  }, []);

  function buildPayload() {
    // Strip server-managed fields. _id/tenantId/createdAt/updatedAt are
    // either set by the server on create or untouchable on update.
    const { _id, tenantId, createdAt, updatedAt, ...rest } = draft;
    void _id;
    void tenantId;
    void createdAt;
    void updatedAt;
    return rest;
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const url = isNew ? "/api/agents" : `/api/agents/${draft._id}`;
      const method = isNew ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? `Save failed (${res.status})`);
        return;
      }
      const saved = body as Agent;
      setDraft(saved);
      setSavedAt(new Date());
      if (isNew) {
        router.replace(`/agents/${saved._id}`);
        router.refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (isNew) return;
    if (!confirm(`Delete agent "${draft.name || draft._id}"? This cannot be undone.`)) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/agents/${draft._id}`, { method: "DELETE" });
      if (res.status === 204) {
        router.replace("/agents");
        router.refresh();
        return;
      }
      const body = await res.json().catch(() => ({}));
      if (res.status === 409 && body.campaigns) {
        setError(
          `Cannot delete — ${body.campaigns} active campaign(s) reference this agent. Pause or reassign them first.`,
        );
      } else {
        setError(body.error ?? `Delete failed (${res.status})`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  const voicesForProvider = voices.filter(
    (v) => v.provider === draft.voice.provider,
  );
  const usesLibrary = voicesForProvider.length > 0 && draft.voice.provider !== "cloned";

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">
            {isNew ? "New agent" : draft.name || "(unnamed agent)"}
          </h1>
          <p className="text-sm text-zinc-500">
            Status: <span className="font-medium">{draft.status}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {savedAt && !error && (
            <span className="text-xs text-zinc-500">
              Saved {savedAt.toLocaleTimeString()}
            </span>
          )}
          {!isNew && (
            <Button
              variant="destructive"
              onClick={remove}
              disabled={deleting || saving}
            >
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          )}
          <Button onClick={save} disabled={saving || deleting}>
            {saving ? "Saving…" : isNew ? "Create" : "Save"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {isNew && (
        <div className="mb-8 space-y-3">
          <Label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Quick Start Templates (Prebuilt NBFC Agents)
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {NBFC_TEMPLATES.map((tpl) => (
              <button
                key={tpl.name}
                type="button"
                onClick={() => {
                  applyTemplate(tpl);
                  setSelectedTemplate(tpl.name);
                }}
                className={`flex flex-col text-left p-4 rounded-2xl transition-all border ${selectedTemplate === tpl.name
                    ? "border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/20 shadow-md ring-2 ring-indigo-500/20"
                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-950 hover:bg-zinc-50/30 hover:shadow-sm"
                  }`}
              >
                <div className="flex items-center gap-3.5 mb-2 w-full">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${tpl.gradient} text-white flex items-center justify-center shrink-0`}>
                    {tpl.name.includes("Eligibility") && (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    )}
                    {tpl.name.includes("Follow-up") && (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    )}
                    {tpl.name.includes("Approval") && (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
                    )}
                    {tpl.name.includes("Collection") && (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 leading-tight truncate">
                      {tpl.name}
                    </h4>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 block mt-0.5">
                      {tpl.provider} · {tpl.model}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal line-clamp-2">
                  {tpl.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6 space-y-1">
        <Label htmlFor="name">Agent name</Label>
        <Input
          id="name"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          placeholder="e.g. Inbound qualifier"
        />
      </div>

      <Tabs defaultValue="prompt" className="space-y-4">
        <TabsList>
          <TabsTrigger value="prompt">Prompt</TabsTrigger>
          <TabsTrigger value="voice">Voice</TabsTrigger>
          <TabsTrigger value="model">Model</TabsTrigger>
        </TabsList>

        <TabsContent value="prompt">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-1">
                <Label htmlFor="greeting">Greeting</Label>
                <Textarea
                  id="greeting"
                  rows={3}
                  value={draft.greeting}
                  onChange={(e) => setDraft({ ...draft, greeting: e.target.value })}
                  placeholder="What the agent says when the call connects."
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="prompt">System prompt</Label>
                <Textarea
                  id="prompt"
                  rows={16}
                  value={draft.prompt}
                  onChange={(e) => setDraft({ ...draft, prompt: e.target.value })}
                  placeholder="Define the agent's role, tone, and rules."
                  className="font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="voice">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-1">
                <Label htmlFor="voice-provider">Provider</Label>
                <Select
                  value={draft.voice.provider}
                  onValueChange={(value) => {
                    const provider = value as VoiceProvider;
                    // When switching providers, preselect the first voice
                    // from that provider's library so the picker isn't stale.
                    const first = voices.find((v) => v.provider === provider);
                    setDraft({
                      ...draft,
                      voice: {
                        ...draft.voice,
                        provider,
                        providerVoiceId: first?.providerVoiceId ?? "",
                      },
                    });
                  }}
                >
                  <SelectTrigger id="voice-provider">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VOICE_PROVIDERS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {usesLibrary ? (
                <div className="space-y-1">
                  <Label htmlFor="voice-id">Voice</Label>
                  <Select
                    value={draft.voice.providerVoiceId}
                    onValueChange={(value) =>
                      setDraft({
                        ...draft,
                        voice: { ...draft.voice, providerVoiceId: value ?? "" },
                      })
                    }
                  >
                    <SelectTrigger id="voice-id">
                      <SelectValue placeholder="Pick a voice" />
                    </SelectTrigger>
                    <SelectContent>
                      {voicesForProvider.map((v) => (
                        <SelectItem key={v.providerVoiceId} value={v.providerVoiceId}>
                          {v.name}
                          {v.gender ? ` · ${v.gender}` : ""}
                          {v.language ? ` · ${v.language}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-1">
                  <Label htmlFor="voice-id">Voice id</Label>
                  <Input
                    id="voice-id"
                    value={draft.voice.providerVoiceId}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        voice: { ...draft.voice, providerVoiceId: e.target.value },
                      })
                    }
                    placeholder={
                      draft.voice.provider === "cloned"
                        ? "Your cloned voice id"
                        : "Voice id"
                    }
                  />
                  {draft.voice.provider === "cloned" && (
                    <p className="text-xs text-zinc-500">
                      Find cloned voice ids under <strong>Voice clones</strong>.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="model">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-1">
                <Label htmlFor="model">Realtime model</Label>
                <Select
                  value={draft.llm.realtimeModel}
                  onValueChange={(value) =>
                    setDraft({
                      ...draft,
                      llm: { ...draft.llm, realtimeModel: value as RealtimeModel },
                    })
                  }
                >
                  <SelectTrigger id="model">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REALTIME_MODELS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="temperature">
                  Temperature ({draft.llm.temperature.toFixed(2)})
                </Label>
                <Input
                  id="temperature"
                  type="range"
                  min={0}
                  max={2}
                  step={0.05}
                  value={draft.llm.temperature}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      llm: {
                        ...draft.llm,
                        temperature: Number(e.target.value),
                      },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
