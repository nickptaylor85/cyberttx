"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

interface Alert { id: string; title: string; description: string; severity: string; source: string; category: string; mitreTechniques: string[]; timestamp: string; affectedAssets?: string[]; status?: string; }

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [connectorCount, setConnectorCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<{ connector: string; error: string }[]>([]);
  const [search, setSearch] = useState(""); const [sevFilter, setSevFilter] = useState("ALL");

  useEffect(() => {
    fetch("/api/portal/alerts").then(r => r.ok ? r.json() : { alerts: [], connectors: 0 }).then(d => {
      setAlerts(d.alerts || []); setConnectorCount(d.connectors || 0); setErrors(d.errors || []); setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = alerts.filter(a => {
    if (sevFilter !== "ALL" && a.severity !== sevFilter.toLowerCase()) return false;
    if (search && !a.title.toLowerCase().includes(search.toLowerCase()) && !a.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const sc: Record<string, string> = { critical: "bg-red-500/20 text-red-400", high: "bg-orange-500/20 text-orange-400", medium: "bg-yellow-500/20 text-yellow-400", low: "bg-green-500/20 text-green-400" };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div><h1 className="font-display text-xl sm:text-2xl font-bold text-white">Live Alert Feed</h1><p className="text-gray-500 text-xs mt-1">{alerts.length} alerts from {connectorCount} connector{connectorCount !== 1 ? "s" : ""}</p></div>
        <Link href="/portal/integrations" className="cyber-btn-secondary text-sm">Configure Connectors →</Link>
      </div>

      {connectorCount === 0 ? (
        <div className="cyber-card text-center py-12">
          <p className="text-3xl mb-3">🔌</p>
          <p className="text-gray-400 text-sm">No security tools connected</p>
          <p className="text-gray-500 text-xs mt-1 mb-4">Connect your SIEM, XDR, or vulnerability scanner to pull real alerts</p>
          <Link href="/portal/integrations" className="cyber-btn-primary text-sm">Set Up Connectors →</Link>
        </div>
      ) : <>
        <div className="flex gap-2 mb-4">
          <input className="cyber-input flex-1 text-sm" placeholder="Search alerts..." value={search} onChange={e => setSearch(e.target.value)} />
          <select className="cyber-input w-auto text-sm" value={sevFilter} onChange={e => setSevFilter(e.target.value)}>
            <option value="ALL">All Severity</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        {errors.length > 0 && (
          <div className="cyber-card border-red-500/20 mb-4">
            <h3 className="text-red-400 text-xs font-semibold mb-2">Connection Errors</h3>
            <div className="space-y-1.5">{errors.map((e, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className="text-red-400 font-semibold flex-shrink-0">{e.connector}:</span>
                <span className="text-gray-400 break-all">{e.error}</span>
              </div>
            ))}</div>
            <p className="text-gray-600 text-xs mt-2">Check your credentials in Integrations. The error message above is from the vendor API.</p>
          </div>
        )}

        {loading ? <p className="text-gray-500 text-center py-8">Fetching alerts from your security tools...</p> :
          filtered.length === 0 ? <div className="cyber-card text-center py-8"><p className="text-gray-400 text-sm">No alerts found</p></div> :
          <div className="space-y-2">{filtered.map(a => (
            <div key={a.id} className="cyber-card">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`cyber-badge text-xs ${sc[a.severity]}`}>{a.severity}</span>
                    <span className="text-gray-500 text-xs">{a.source}</span>
                    <span className="text-gray-600 text-xs">{a.category}</span>
                    <span className="text-gray-600 text-xs">{new Date(a.timestamp).toLocaleString("en-GB")}</span>
                  </div>
                  <p className="text-white text-sm font-medium">{a.title}</p>
                  {a.description && <p className="text-gray-500 text-xs mt-1 line-clamp-2">{a.description}</p>}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {a.mitreTechniques.map(t => <span key={t} className="cyber-badge text-xs bg-cyber-600/10 text-cyber-400">{t}</span>)}
                    {a.affectedAssets?.map(asset => <span key={asset} className="cyber-badge text-xs bg-surface-3 text-gray-400">{asset}</span>)}
                  </div>
                </div>
                <button
                  onClick={() => {
                    sessionStorage.setItem("tc_alert_incident", JSON.stringify({ title: a.title, description: a.description, severity: a.severity, source: a.source, mitre: a.mitreTechniques, assets: a.affectedAssets }));
                    window.location.href = "/portal/ttx/new?fromAlert=1";
                  }}
                  className="cyber-btn-primary text-xs py-1.5 px-3 flex-shrink-0 whitespace-nowrap"
                >
                  Build TTX →
                </button>
              </div>
            </div>
          ))}</div>
        }
      </>}
    </div>
  );
}
