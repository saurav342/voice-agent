import type { VoiceClone, VoiceProvider } from "@voiceplatform/shared";

import { api, ApiError } from "@/lib/api";
import { CloneVoiceForm } from "./clone-voice-form";
import { CloneList } from "./clone-list";

interface LibraryVoice {
  provider: VoiceProvider;
  providerVoiceId: string;
  name: string;
  language?: string;
  gender?: string;
}

async function fetchStockVoices(): Promise<LibraryVoice[]> {
  try {
    const { voices } = await api.get<{ voices: LibraryVoice[] }>("/voices");
    return voices;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
}

async function fetchVoiceClones(): Promise<VoiceClone[]> {
  try {
    const { voiceClones } = await api.get<{ voiceClones: VoiceClone[] }>(
      "/voice-clones",
    );
    return voiceClones;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return [];
    throw err;
  }
}

export default async function VoicesPage() {
  const [stock, clones] = await Promise.all([
    fetchStockVoices(),
    fetchVoiceClones(),
  ]);

  const byProvider = new Map<VoiceProvider, LibraryVoice[]>();
  for (const v of stock) {
    const list = byProvider.get(v.provider) ?? [];
    list.push(v);
    byProvider.set(v.provider, list);
  }

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 glass-card p-6 rounded-3xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="badge badge-emerald text-[11px] font-bold">
              Speech Synthesis Engine
            </span>
            <span className="text-xs text-[var(--c-text-dim)] font-medium">
              {stock.length} stock voices • {clones.length} custom clones
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground mt-1">
            Voice Catalog & Cloning
          </h1>
          <p className="mt-1 text-sm text-[var(--c-text-secondary)]">
            Explore neural AI voice models from ElevenLabs, Cartesia, OpenAI, and Deepgram, or clone custom voices.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Voice Cloning Form */}
        <div className="lg:col-span-1 glass-card p-6 rounded-3xl space-y-4 border border-[var(--c-border)]">
          <div>
            <span className="badge badge-purple text-[10px] font-bold">
              AI Voice Cloning
            </span>
            <h2 className="text-xl font-extrabold text-foreground mt-2">Clone a Custom Voice</h2>
            <p className="text-xs text-[var(--c-text-secondary)] mt-1 leading-relaxed">
              Upload a 10–30 second clean audio clip. Your custom cloned voice will immediately become available in the agent creator.
            </p>
          </div>
          <div className="h-px bg-[var(--c-border)]" />
          <CloneVoiceForm />
        </div>

        {/* Cloned Voices List */}
        <div className="lg:col-span-2 glass-card p-6 rounded-3xl space-y-4 border border-[var(--c-border)]">
          <div>
            <span className="badge badge-emerald text-[10px] font-bold">
              Your Library
            </span>
            <h2 className="text-xl font-extrabold text-foreground mt-2">Cloned Voices</h2>
            <p className="text-xs text-[var(--c-text-secondary)] mt-1">
              Active custom voice clones assigned to your workspace.
            </p>
          </div>
          <div className="h-px bg-[var(--c-border)]" />
          <CloneList clones={clones} />
        </div>
      </div>

      {/* Stock Voice Catalog grouped by Provider */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-foreground">Stock Voice Library</h2>
          <span className="text-xs text-[var(--c-text-dim)] font-medium">Grouped by Provider</span>
        </div>

        {[...byProvider.entries()].map(([provider, voices]) => (
          <div key={provider} className="glass-card rounded-3xl overflow-hidden border border-[var(--c-border)]">
            <div className="px-6 py-4 border-b border-[var(--c-border)] bg-[var(--c-overlay-xs)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-[var(--brand)] inline-block" />
                <h3 className="text-base font-extrabold text-foreground capitalize">{provider} Catalog</h3>
              </div>
              <span className="badge badge-emerald text-[10px] font-bold">
                {voices.length} voices available
              </span>
            </div>

            <div className="p-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-bold uppercase tracking-wider text-[var(--c-text-dim)] border-b border-[var(--c-border)]">
                    <th className="px-5 py-3">Voice Name</th>
                    <th className="px-5 py-3">Voice ID</th>
                    <th className="px-5 py-3">Gender</th>
                    <th className="px-5 py-3">Language</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--c-border)]">
                  {voices.map((v) => (
                    <tr
                      key={`${v.provider}:${v.providerVoiceId}`}
                      className="hover:bg-[var(--c-row-hover)] transition-colors"
                    >
                      <td className="px-5 py-3.5 font-bold text-foreground">{v.name}</td>
                      <td className="px-5 py-3.5 font-mono text-xs text-[var(--brand)]">
                        <span className="px-2 py-0.5 rounded-md bg-[var(--c-overlay-sm)] border border-[var(--c-border)]">
                          {v.providerVoiceId}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs capitalize text-[var(--c-text-secondary)]">
                        {v.gender ?? "—"}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-[var(--c-text-secondary)]">
                        {v.language ?? "en-US"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

