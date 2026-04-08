"use client";
import { useState, useEffect } from "react";

interface ThreatActor { id: string; name: string; aliases: string[]; origin: string; type: string; motivation: string; targets: string[]; activeSince: string; ttps: string[]; notableAttacks: string[]; description: string; isCustom?: boolean; }

export default function AdminThreatActorsPage() {
  const [actors, setActors] = useState<ThreatActor[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [syncing, setSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);
  const [discoverError, setDiscoverError] = useState("");

  function loadActors() {
    fetch("/api/portal/threat-actors").then(r => r.ok ? r.json() : { actors: [] }).then((d: any) => {
      setActors(d.actors || []);
      setLoading(false);
    });
  }

  useEffect(() => { loadActors(); }, []);

  async function syncThreatActors() {
    setSyncing(true); setSyncResults([]); setDiscoverError("");
    try {
      const res = await fetch("/api/portal/threat-actors?trending=true");
      const data = await res.json() as any;
      if (data.trendingError) {
        setDiscoverError(data.trendingError);
      }
      setSyncResults(data.trending || []);
    } catch (e: any) { setDiscoverError(e?.message || "Network error"); }
    setSyncing(false);
  }

  async function addActor(actor: any) {
    setAdding(actor.name);
    try {
      const res = await fetch("/api/portal/threat-actors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: actor.name,
          aliases: actor.aliases || [],
          origin: actor.origin || "Unknown",
          type: actor.type || "cybercrime",
          motivation: actor.motivation || "",
          targets: actor.targets || [],
          activeSince: actor.activeSince || "",
          ttps: actor.ttps || [],
          ttpDescriptions: actor.ttpDescriptions || [],
          notableAttacks: actor.notableAttacks || [],
          description: actor.description || "",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        // Remove from sync results and reload actors
        setSyncResults(prev => prev.filter(r => r.name !== actor.name));
        loadActors();
      } else {
        alert(data.error || "Failed to add");
      }
    } catch { alert("Failed to add actor"); }
    setAdding(null);
  }

  const types = ["ALL", ...new Set(actors.map(a => a.type))];
  const filtered = actors.filter(a => {
    if (typeFilter !== "ALL" && a.type !== typeFilter) return false;
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.aliases?.some(al => al.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  const hardcoded = filtered.filter(a => !(a as any).isCustom);
  const custom = filtered.filter(a => (a as any).isCustom);

  const tc: Record<string, string> = { "nation-state": "bg-red-500/20 text-red-400", "cybercrime": "bg-orange-500/20 text-orange-400", "hacktivist": "bg-yellow-500/20 text-yellow-400", "insider": "bg-blue-500/20 text-blue-400" };

  if (loading) return <div className="text-center py-20 text-gray-500">Loading threat actors...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-xl font-bold text-white">Threat Actors</h1>
          <p className="text-gray-500 text-xs mt-1">{hardcoded.length} built-in · {custom.length} discovered</p>
        </div>
        <button onClick={syncThreatActors} disabled={syncing} className="cyber-btn-primary text-sm disabled:opacity-50">
          {syncing ? "Loading..." : "🔍 Discover New Actors"}
        </button>
      </div>

      {/* Error display */}
      {discoverError && (
        <div className="cyber-card border-red-500/20 bg-red-600/5 mb-4">
          <p className="text-red-400 text-sm font-semibold">Discover Error</p>
          <p className="text-red-300 text-xs mt-1 font-mono break-all">{discoverError}</p>
        </div>
      )}

      {/* Sync results — with Add buttons */}
      {syncResults.length > 0 && (
        <div className="cyber-card border-purple-500/20 bg-purple-600/5 mb-4">
          <h2 className="text-purple-400 text-sm font-semibold mb-3">🔍 Discovered from Web Search</h2>
          <div className="space-y-2">
            {syncResults.map((r: any, i: number) => {
              const alreadyExists = actors.some(a => a.name.toLowerCase() === (r.name || "").toLowerCase());
              return (
                <div key={i} className="p-3 bg-surface-2 rounded-lg border border-surface-3 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white text-sm font-medium">{r.name || "Unknown"}</p>
                      {r.type && <span className={"cyber-badge text-xs " + (tc[r.type] || "bg-gray-500/20 text-gray-400")}>{r.type}</span>}
                    </div>
                    <p className="text-gray-400 text-xs mt-1">{r.description || ""}</p>
                    {r.targets?.length > 0 && <p className="text-gray-500 text-xs mt-0.5">Targets: {r.targets.join(", ")}</p>}
                    {r.notableAttacks?.length > 0 && <p className="text-[#00ffd5] text-xs mt-0.5">{r.notableAttacks.join(" · ")}</p>}
                  </div>
                  {alreadyExists ? (
                    <span className="text-gray-500 text-xs flex-shrink-0 mt-1">Already added</span>
                  ) : (
                    <button onClick={() => addActor(r)} disabled={adding === r.name}
                      className="cyber-btn-primary text-xs py-1.5 px-3 flex-shrink-0">
                      {adding === r.name ? "Adding..." : "+ Add"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
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

      {/* Custom actors section */}
      {custom.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2">Discovered Actors ({custom.length})</p>
          <div className="space-y-2">
            {custom.map(actor => (
              <div key={actor.id} className="cyber-card border-purple-500/10">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-white text-sm font-semibold">{actor.name}</p>
                      <span className={"cyber-badge text-xs " + (tc[actor.type] || "bg-gray-500/20 text-gray-400")}>{actor.type}</span>
                      <span className="cyber-badge text-xs bg-purple-500/20 text-purple-400">discovered</span>
                    </div>
                    {actor.aliases?.length > 0 && <p className="text-gray-600 text-xs">aka {actor.aliases.join(", ")}</p>}
                    <p className="text-gray-500 text-xs mt-1">{actor.origin} · {actor.motivation}</p>
                    <p className="text-gray-400 text-xs mt-1 line-clamp-2">{actor.description}</p>
                  </div>
                </div>
                {actor.notableAttacks?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {actor.notableAttacks.map((a, i) => <span key={i} className="px-2 py-0.5 bg-surface-3 rounded text-xs text-[#00ffd5]">{a}</span>)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Built-in actors */}
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Built-in Actors ({hardcoded.length})</p>
      <div className="space-y-2">
        {hardcoded.map(actor => (
          <div key={actor.id} className="cyber-card">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-white text-sm font-semibold">{actor.name}</p>
                  <span className={"cyber-badge text-xs " + (tc[actor.type] || "bg-gray-500/20 text-gray-400")}>{actor.type}</span>
                </div>
                {actor.aliases?.length > 0 && <p className="text-gray-600 text-xs">aka {actor.aliases.join(", ")}</p>}
                <p className="text-gray-500 text-xs mt-1">{actor.origin} · {actor.motivation} · Since {actor.activeSince}</p>
                <p className="text-gray-400 text-xs mt-1 line-clamp-2">{actor.description}</p>
              </div>
              <div className="text-right ml-4 flex-shrink-0">
                <p className="text-gray-600 text-xs">{actor.ttps?.length || 0} TTPs</p>
              </div>
            </div>
            {actor.notableAttacks?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {actor.notableAttacks.map((a, i) => <span key={i} className="px-2 py-0.5 bg-surface-3 rounded text-xs text-[#00ffd5]">{a}</span>)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
