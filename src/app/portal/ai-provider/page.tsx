"use client";
import { useState, useEffect } from "react";

const PROVIDERS = [
  { id: "anthropic", name: "Anthropic Claude", icon: "🟣", desc: "Excellent at structured scenarios and reasoning", models: [{ id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4" }, { id: "claude-haiku-4-5-20251001", name: "Claude Haiku 4.5 (Faster)" }] },
  { id: "openai", name: "OpenAI", icon: "🟢", desc: "Native JSON mode — most reliable output format", models: [{ id: "gpt-4o", name: "GPT-4o" }, { id: "gpt-4o-mini", name: "GPT-4o Mini (Faster)" }, { id: "o3-mini", name: "o3 Mini" }] },
  { id: "google", name: "Google Gemini", icon: "🔵", desc: "Fast and cost-effective. JSON output mode.", models: [{ id: "gemini-2.5-flash-preview-04-17", name: "Gemini 2.5 Flash" }, { id: "gemini-2.5-pro-preview-05-06", name: "Gemini 2.5 Pro" }] },
];

export default function AIProviderPage() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [provider, setProvider] = useState("anthropic");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/portal/ai-provider").then(r => r.json()).then(d => {
      setConfig(d);
      setProvider(d.provider || "anthropic");
      setModel(d.model || "");
      setEnabled(d.enabled || false);
      setLoading(false);
    });
  }, []);

  async function save() {
    setSaving(true); setMessage("");
    const res = await fetch("/api/portal/ai-provider", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, apiKey: apiKey || "unchanged", model: model || null, enabled }),
    });
    const d = await res.json();
    if (res.ok) {
      setMessage("Saved successfully. Exercises will now use your " + PROVIDERS.find(p => p.id === provider)?.name + " key.");
      setApiKey("");
      // Refresh config
      const refreshed = await fetch("/api/portal/ai-provider").then(r => r.json());
      setConfig(refreshed);
    } else {
      setMessage("Error: " + (d.error || "Failed to save"));
    }
    setSaving(false);
  }

  async function remove() {
    if (!confirm("Remove your API key and revert to ThreatCast default?")) return;
    await fetch("/api/portal/ai-provider", { method: "DELETE" });
    setProvider("anthropic"); setApiKey(""); setModel(""); setEnabled(false);
    setMessage("Reverted to ThreatCast default AI provider.");
    const refreshed = await fetch("/api/portal/ai-provider").then(r => r.json());
    setConfig(refreshed);
  }

  const selectedProvider = PROVIDERS.find(p => p.id === provider);

  if (loading) return <div className="text-center py-20 text-gray-500">Loading...</div>;

  // Not on Pro/Enterprise
  if (!config?.byokAvailable) {
    return (
      <div>
        <h1 className="font-display text-xl font-bold text-white mb-2">AI Provider</h1>
        <p className="text-gray-500 text-sm mb-6">Bring your own API key for exercise generation</p>
        <div className="cyber-card text-center py-12">
          <p className="text-3xl mb-3">🔒</p>
          <h2 className="text-white text-lg font-semibold mb-2">Pro & Enterprise Feature</h2>
          <p className="text-gray-400 text-sm mb-4">BYOK (Bring Your Own Key) lets you use your own Anthropic, OpenAI, or Google Gemini API key for exercise generation. This gives you full control over AI costs and data processing.</p>
          <p className="text-gray-500 text-xs">Available on Professional (£499/mo) and Enterprise (£999/mo) plans.</p>
        </div>

        <div className="cyber-card mt-4">
          <p className="text-gray-400 text-sm mb-3">Currently using:</p>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🟣</span>
            <div>
              <p className="text-white text-sm font-semibold">ThreatCast Default — Anthropic Claude</p>
              <p className="text-gray-500 text-xs">Included in your plan. No API key needed.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-xl font-bold text-white mb-2">AI Provider</h1>
      <p className="text-gray-500 text-sm mb-6">Use your own API key for exercise generation, or use the ThreatCast default.</p>

      {/* Current status */}
      <div className="cyber-card mb-4">
        <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Current Provider</p>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{config?.hasKey ? selectedProvider?.icon : "🟣"}</span>
          <div>
            <p className="text-white text-sm font-semibold">
              {config?.enabled && config?.hasKey ? selectedProvider?.name + " (Your Key)" : "ThreatCast Default — Anthropic Claude"}
            </p>
            {config?.maskedKey && <p className="text-gray-600 text-xs font-mono">{config.maskedKey}</p>}
          </div>
        </div>
      </div>

      {/* Provider selection */}
      <div className="cyber-card mb-4">
        <p className="text-gray-400 text-xs uppercase tracking-wider mb-3">Select Provider</p>
        <div className="grid grid-cols-3 gap-3">
          {PROVIDERS.map(p => (
            <button key={p.id} onClick={() => { setProvider(p.id); setModel(""); }}
              className={"p-4 rounded-lg border text-left transition-all " + (provider === p.id ? "border-[#00ffd5]/50 bg-[#00ffd5]/5" : "border-surface-3 bg-surface-2 hover:border-surface-4")}>
              <span className="text-2xl">{p.icon}</span>
              <p className="text-white text-sm font-semibold mt-2">{p.name}</p>
              <p className="text-gray-500 text-xs mt-1">{p.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* API Key + Model */}
      <div className="cyber-card mb-4">
        <div className="mb-4">
          <label className="cyber-label">API Key</label>
          <input type="password" className="cyber-input w-full font-mono" placeholder={config?.hasKey ? "••••••••  (leave empty to keep current)" : "Paste your API key"}
            value={apiKey} onChange={e => setApiKey(e.target.value)} />
          <p className="text-gray-600 text-xs mt-1">
            {provider === "anthropic" && "Get your key at console.anthropic.com → API Keys"}
            {provider === "openai" && "Get your key at platform.openai.com → API Keys"}
            {provider === "google" && "Get your key at aistudio.google.com → API Keys"}
          </p>
        </div>

        <div className="mb-4">
          <label className="cyber-label">Model</label>
          <select className="cyber-input w-full" value={model} onChange={e => setModel(e.target.value)}>
            <option value="">Default</option>
            {selectedProvider?.models.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setEnabled(!enabled)}
            className={"w-12 h-6 rounded-full transition-all relative " + (enabled ? "bg-[#00ffd5]" : "bg-surface-3")}>
            <span className={"absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all " + (enabled ? "left-6" : "left-0.5")} />
          </button>
          <span className="text-white text-sm">Enable BYOK</span>
          <span className="text-gray-500 text-xs">{enabled ? "Exercises will use your API key" : "Using ThreatCast default"}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={save} disabled={saving} className="cyber-btn-primary disabled:opacity-50">
          {saving ? "Validating & Saving..." : "Save Provider Settings"}
        </button>
        {config?.hasKey && (
          <button onClick={remove} className="cyber-btn-secondary text-red-400 hover:text-red-300">
            Remove Key
          </button>
        )}
      </div>

      {message && (
        <div className={"mt-4 p-3 rounded-lg text-sm " + (message.startsWith("Error") ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400")}>
          {message}
        </div>
      )}

      {/* Info */}
      <div className="cyber-card mt-6 bg-surface-0">
        <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">How BYOK Works</p>
        <div className="text-gray-500 text-xs space-y-1">
          <p>• Your API key is stored securely and only used for exercise generation</p>
          <p>• All AI calls go directly from ThreatCast servers to your chosen provider</p>
          <p>• You control the costs — check your provider's pricing dashboard</p>
          <p>• OpenAI's JSON mode guarantees valid output (fewer generation errors)</p>
          <p>• You can switch providers or revert to default at any time</p>
        </div>
      </div>
    </div>
  );
}
