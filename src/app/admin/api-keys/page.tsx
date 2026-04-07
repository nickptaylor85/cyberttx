"use client";
import { useState, useEffect } from "react";

interface ApiKey { id: string; name: string; keyPrefix: string; created: string; }

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [name, setName] = useState("");
  const [newKey, setNewKey] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("tc_api_keys");
    if (stored) try { setKeys(JSON.parse(stored)); } catch {}
  }, []);

  function save(k: ApiKey[]) { setKeys(k); localStorage.setItem("tc_api_keys", JSON.stringify(k)); }

  function generate() {
    if (!name) return;
    const key = "tc_" + Array.from({ length: 32 }, () => "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)]).join("");
    const item: ApiKey = { id: Date.now().toString(), name, keyPrefix: key.slice(0, 10), created: new Date().toISOString() };
    save([item, ...keys]); setNewKey(key); setName("");
  }

  function revoke(id: string) { if (confirm("Revoke this API key?")) save(keys.filter(k => k.id !== id)); }

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl font-bold text-white">API Keys</h1><p className="text-gray-500 text-xs mt-1">Programmatic access to the ThreatCast API</p></div>

      <div className="cyber-card mb-4 border-yellow-500/20 bg-yellow-500/5">
        <p className="text-yellow-400 text-xs font-semibold">⚠️ API Authentication Coming Soon</p>
        <p className="text-gray-500 text-xs mt-1">Generated keys are saved for when API authentication goes live. The exercise generation, report, and export endpoints will accept Bearer token auth.</p>
      </div>

      <div className="cyber-card mb-4 border-cyber-600/30">
        <h3 className="text-white text-sm font-semibold mb-3">Generate New Key</h3>
        <div className="flex gap-2">
          <input className="cyber-input flex-1 text-sm" placeholder="Key name (e.g. CI/CD Pipeline)" value={name} onChange={e => setName(e.target.value)} />
          <button onClick={generate} disabled={!name} className="cyber-btn-primary text-sm disabled:opacity-50">Generate</button>
        </div>
        {newKey && (
          <div className="mt-3 p-3 rounded bg-green-500/10 border border-green-500/30">
            <p className="text-green-400 text-xs font-semibold mb-1">Key generated — copy now, it won&apos;t be shown again!</p>
            <p className="font-mono text-xs text-green-300 bg-surface-0 p-2 rounded select-all break-all">{newKey}</p>
          </div>
        )}
      </div>

      {keys.length === 0 ? (
        <div className="cyber-card text-center py-8"><p className="text-gray-500 text-sm">No API keys generated</p></div>
      ) : (
        <div className="space-y-2">{keys.map(k => (
          <div key={k.id} className="cyber-card flex items-center justify-between">
            <div><p className="text-white text-sm">{k.name}</p><p className="text-gray-500 text-xs font-mono">{k.keyPrefix}{"•".repeat(22)}</p><p className="text-gray-600 text-xs mt-0.5">Created {new Date(k.created).toLocaleDateString("en-GB")}</p></div>
            <button onClick={() => revoke(k.id)} className="text-red-400/60 hover:text-red-400 text-xs">Revoke</button>
          </div>
        ))}</div>
      )}

      <div className="cyber-card mt-4">
        <h3 className="text-white text-sm font-semibold mb-2">API Endpoints (coming soon)</h3>
        <div className="space-y-1 text-xs text-gray-500">
          <p><span className="text-green-400 font-mono">POST</span> /api/ttx/generate — Generate exercise</p>
          <p><span className="text-blue-400 font-mono">GET</span> /api/portal/sessions — List exercises</p>
          <p><span className="text-blue-400 font-mono">GET</span> /api/portal/report — Exercise report</p>
          <p><span className="text-blue-400 font-mono">GET</span> /api/portal/export — Export data (CSV)</p>
        </div>
      </div>
    </div>
  );
}
