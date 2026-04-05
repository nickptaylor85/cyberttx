"use client";
import { useState } from "react";

interface ApiKey { id: string; name: string; prefix: string; client: string; createdAt: string; lastUsed: string | null; active: boolean; }

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [name, setName] = useState(""); const [client, setClient] = useState("");

  function generateKey() {
    if (!name.trim()) return;
    const key = `tc_${Array.from({ length: 32 }, () => "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)]).join("")}`;
    const k: ApiKey = { id: Date.now().toString(), name, prefix: key.slice(0, 10) + "...", client: client || "All", createdAt: new Date().toISOString(), lastUsed: null, active: true };
    setKeys(prev => [k, ...prev]);
    setNewKey(key); setName(""); setClient("");
  }

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl sm:text-2xl font-bold text-white">API Key Management</h1><p className="text-gray-500 text-xs sm:text-sm mt-1">Issue and manage API keys for Enterprise clients</p></div>

      <div className="cyber-card mb-6">
        <h2 className="text-white text-sm font-semibold mb-3">Generate API Key</h2>
        <div className="flex gap-2 mb-2">
          <input className="cyber-input flex-1" placeholder="Key name (e.g. Production API)" value={name} onChange={e => setName(e.target.value)} />
          <input className="cyber-input flex-1" placeholder="Client (optional)" value={client} onChange={e => setClient(e.target.value)} />
          <button onClick={generateKey} className="cyber-btn-primary text-sm whitespace-nowrap">Generate</button>
        </div>
        {newKey && (
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg mt-2">
            <p className="text-green-400 text-xs font-semibold mb-1">Copy this key — it won&apos;t be shown again:</p>
            <code className="text-green-300 text-xs font-mono break-all select-all">{newKey}</code>
          </div>
        )}
      </div>

      {keys.length > 0 && (
        <div className="cyber-card">
          <h2 className="text-white text-sm font-semibold mb-3">Active Keys</h2>
          <div className="space-y-2">{keys.map(k => (
            <div key={k.id} className="flex items-center justify-between py-2 border-b border-surface-3/50 last:border-0">
              <div><p className="text-white text-sm">{k.name}</p><p className="text-gray-500 text-xs font-mono">{k.prefix} · {k.client}</p></div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${k.active ? "bg-green-400" : "bg-red-400"}`} />
                <button onClick={() => setKeys(prev => prev.map(x => x.id === k.id ? { ...x, active: false } : x))} className="text-gray-500 hover:text-red-400 text-xs">Revoke</button>
              </div>
            </div>
          ))}</div>
        </div>
      )}
    </div>
  );
}
