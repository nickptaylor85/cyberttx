"use client";
import { useState, useEffect } from "react";

interface ThreatActor { id: string; name: string; aliases: string[]; origin: string; type: string; motivation: string; targets: string[]; activeSince: string; ttps: string[]; notableAttacks: string[]; description: string; }

export default function AdminThreatActorsPage() {
  const [actors, setActors] = useState<ThreatActor[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [syncing, setSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portal/threat-actors").then(r => r.ok ? r.json() : { actors: [] }).then((d: any) => {
      setActors(d.actors || []);
      setLoading(false);
    });
  }, []);

  async function syncThreatActors() {
    setSyncing(true); setSyncResults([]);
    try {
      const res = await fetch("/api/portal/threat-actors?trending=true");
      const data = await res.json() as any;
      setSyncResults(data.trending || []);
    } catch { setSyncResults([]); }
    setSyncing(false);
  }

  const types = ["ALL", ...new Set(actors.map(a => a.type))];
  const filtered = actors.filter(a => {
    if (typeFilter !== "ALL" && a.type !== typeFilter) return false;
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.aliases.some(al => al.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  const tc: Record<string, string> = { "nation-state": "bg-red-500/20 text-red-400", "cybercrime": "bg-orange-500/20 text-orange-400", "hacktivist": "bg-yellow-500/20 text-yellow-400", "insider": "bg-blue-500/20 text-blue-400" };

  if (loading) return <div className="text-center py-20 text-gray-500">Loading threat actors...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-xl font-bold text-white">Threat Actors</h1>
          <p className="text-gray-500 text-xs mt-1">{actors.length} actors in database</p>
        </div>
        <button onClick={syncThreatActors} disabled={syncing} className="cyber-btn-primary text-sm disabled:opacity-50">
          {syncing ? "Searching the web..." : "🔍 Discover New Actors"}
        </button>
      </div>

      {/* Sync results */}
      {syncResults.length > 0 && (
        <div className="cyber-card border-purple-500/20 bg-purple-600/5 mb-4">
          <h2 className="text-purple-400 text-sm font-semibold mb-3">🔍 Trending Threat Actors (Live Web Search)</h2>
          <div className="space-y-2">
            {syncResults.map((r: any, i: number) => (
              <div key={i} className="p-3 bg-surface-2 rounded-lg border border-surface-3">
                <p className="text-white text-sm font-medium">{r.name || r.actor || "Unknown"}</p>
                <p className="text-gray-400 text-xs mt-1">{r.description || r.context || r.summary || ""}</p>
              </div>
            ))}
          </div>
          <p className="text-gray-600 text-xs mt-3">These actors were found via live web search. To add them permanently, update the threat actor database.</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {Object.entries(actors.reduce((a, actor) => { a[actor.type] = (a[actor.type] || 0) + 1; return a; }, {} as Record<string, number>)).map(([type, count]) => (
          <div key={type} className="cyber-card text-center">
            <p className="font-display text-xl font-bold text-white">{count}</p>
            <p className="text-gray-500 text-xs capitalize">{type.replace(/-/g, " ")}</p>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex gap-2 mb-4">
        <input className="cyber-input flex-1 text-sm" placeholder="Search actors..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="cyber-input text-sm w-auto" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          {types.map(t => <option key={t} value={t}>{t === "ALL" ? "All Types" : t.replace(/-/g, " ")}</option>)}
        </select>
      </div>

      {/* Actor grid */}
      <div className="space-y-2">
        {filtered.map(actor => (
          <div key={actor.id} className="cyber-card">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-white text-sm font-semibold">{actor.name}</p>
                  <span className={`cyber-badge text-xs ${tc[actor.type] || "bg-gray-500/20 text-gray-400"}`}>{actor.type}</span>
                </div>
                {actor.aliases.length > 0 && <p className="text-gray-600 text-xs">aka {actor.aliases.join(", ")}</p>}
                <p className="text-gray-500 text-xs mt-1">{actor.origin} · {actor.motivation} · Active since {actor.activeSince}</p>
                <p className="text-gray-400 text-xs mt-1 line-clamp-2">{actor.description}</p>
              </div>
              <div className="text-right ml-4 flex-shrink-0">
                <p className="text-gray-600 text-xs">{actor.ttps.length} TTPs</p>
                <p className="text-gray-600 text-xs">{actor.targets.length} targets</p>
              </div>
            </div>
            {actor.notableAttacks.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {actor.notableAttacks.map((a, i) => (
                  <span key={i} className="px-2 py-0.5 bg-surface-3 rounded text-xs text-[#00ffd5]">{a}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
