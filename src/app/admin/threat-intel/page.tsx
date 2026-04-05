"use client";
import { useState, useEffect } from "react";

export default function ThreatIntelPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);

  useEffect(() => { fetch("/api/threat-intel").then(r => r.json()).then(d => { setEvents(d.events || []); setLoading(false); }).catch(() => setLoading(false)); }, []);

  async function scan() {
    setScanning(true);
    const res = await fetch("/api/threat-intel", { method: "POST" });
    if (res.ok) { const d = await res.json(); setEvents(d.events || events); }
    setScanning(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="font-display text-xl sm:text-2xl font-bold text-white">Threat Intelligence</h1><p className="text-gray-500 text-xs sm:text-sm mt-1">{events.length} events · Auto-scans daily at 07:00 UTC</p></div>
        <button onClick={scan} disabled={scanning} className="cyber-btn-primary text-sm disabled:opacity-50">{scanning ? "Scanning..." : "Scan Now"}</button>
      </div>
      {loading ? <p className="text-gray-500 text-center py-12">Loading...</p> :
        <div className="space-y-2">{events.map((e: any, i: number) => (
          <div key={i} className="cyber-card">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-white text-sm font-medium">{e.title || e.name}</p>
                <p className="text-gray-400 text-xs mt-1">{e.description || e.summary}</p>
                <div className="flex gap-2 mt-2">
                  {e.severity && <span className={`cyber-badge text-xs ${e.severity === "critical" ? "bg-red-500/20 text-red-400" : e.severity === "high" ? "bg-orange-500/20 text-orange-400" : "bg-yellow-500/20 text-yellow-400"}`}>{e.severity}</span>}
                  {e.sector && <span className="cyber-badge text-xs bg-surface-3 text-gray-400">{e.sector}</span>}
                </div>
              </div>
              <span className="text-gray-600 text-xs whitespace-nowrap">{e.date || ""}</span>
            </div>
          </div>
        ))}</div>
      }
    </div>
  );
}
