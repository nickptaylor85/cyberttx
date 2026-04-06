"use client";
import { useState, useEffect } from "react";

interface ThreatEvent { title: string; date: string; sector: string; severity: string; threatActor: string; summary: string; source: string; }

export default function ThreatIntelManager({ events, isAdmin }: { events: ThreatEvent[]; isAdmin: boolean }) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("tc_hidden_threats");
    if (stored) setHidden(new Set(JSON.parse(stored)));
  }, []);

  function remove(title: string) {
    if (!confirm("Remove this threat intel event" + (isAdmin ? " globally?" : " from your view?"))) return;
    const next = new Set(hidden);
    next.add(title);
    setHidden(next);
    localStorage.setItem("tc_hidden_threats", JSON.stringify(Array.from(next)));
  }

  function restore() { setHidden(new Set()); localStorage.removeItem("tc_hidden_threats"); }

  async function scan() { setScanning(true); await fetch("/api/threat-intel", { method: "POST" }).catch(() => {}); window.location.reload(); }

  const visible = events.filter(e => !hidden.has(e.title));
  const filtered = visible.filter(e => !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.summary?.toLowerCase().includes(search.toLowerCase()));

  const sc: Record<string, string> = { critical: "bg-red-500/20 text-red-400", high: "bg-orange-500/20 text-orange-400", medium: "bg-yellow-500/20 text-yellow-400", low: "bg-green-500/20 text-green-400" };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <input className="cyber-input flex-1 text-sm" placeholder="Search threats..." value={search} onChange={e => setSearch(e.target.value)} />
        <button onClick={scan} disabled={scanning} className="cyber-btn-primary text-sm disabled:opacity-50">{scanning ? "Scanning..." : "Scan Now"}</button>
        {hidden.size > 0 && <button onClick={restore} className="cyber-btn-secondary text-sm">{hidden.size} hidden · Restore</button>}
      </div>
      {filtered.length === 0 ? <div className="cyber-card text-center py-8"><p className="text-gray-500 text-sm">No threat intel events</p></div> :
        <div className="space-y-2">{filtered.map((e, i) => (
          <div key={i} className="cyber-card">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`cyber-badge text-xs ${sc[e.severity] || "bg-surface-3 text-gray-400"}`}>{e.severity}</span>
                  <span className="text-gray-600 text-xs">{e.source}</span>
                  <span className="text-gray-600 text-xs">{e.sector}</span>
                  <span className="text-gray-600 text-xs">{e.date}</span>
                </div>
                <p className="text-white text-sm font-medium">{e.title}</p>
                {e.summary && <p className="text-gray-500 text-xs mt-1 line-clamp-2">{e.summary}</p>}
                {e.threatActor && e.threatActor !== "Unknown" && <p className="text-red-400/70 text-xs mt-1">Threat Actor: {e.threatActor}</p>}
              </div>
              <button onClick={() => remove(e.title)} className="text-red-400 hover:text-red-300 text-xs flex-shrink-0 p-1" title="Remove">✕</button>
            </div>
          </div>
        ))}</div>
      }
    </div>
  );
}
