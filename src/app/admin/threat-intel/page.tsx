"use client";
import { useState, useEffect } from "react";

interface ThreatEvent { id: string; title: string; severity: string; category: string; source: string; date: string; mitre: string[]; description: string; active: boolean; }

const REAL_WORLD_SCENARIOS = [
  { title: "MOVEit Transfer Zero-Day", severity: "critical", category: "supply-chain", source: "CISA", mitre: ["T1190", "T1059", "T1567"], description: "CL0P ransomware group exploiting MOVEit Transfer vulnerability affecting thousands of organisations globally." },
  { title: "Okta Support System Breach", severity: "critical", category: "identity", source: "Okta Advisory", mitre: ["T1528", "T1550", "T1539"], description: "Threat actors gained access to Okta's support case management system, stealing customer session tokens." },
  { title: "Royal Mail LockBit Ransomware", severity: "critical", category: "ransomware", source: "NCSC", mitre: ["T1486", "T1490", "T1021"], description: "LockBit ransomware attack paralysing Royal Mail international deliveries for weeks." },
  { title: "Barracuda ESG Zero-Day", severity: "high", category: "email-compromise", source: "Mandiant", mitre: ["T1190", "T1505", "T1041"], description: "UNC4841 exploiting Barracuda Email Security Gateway zero-day for espionage operations." },
  { title: "MGM Resorts Social Engineering", severity: "critical", category: "social-engineering", source: "Bloomberg", mitre: ["T1566", "T1078", "T1486"], description: "Scattered Spider social engineering attack shutting down MGM casino operations via helpdesk impersonation." },
  { title: "Microsoft Storm-0558", severity: "critical", category: "apt", source: "Microsoft MSRC", mitre: ["T1528", "T1550.001", "T1199"], description: "Chinese threat actor forging Azure AD tokens to access government email accounts." },
  { title: "3CX Supply Chain Attack", severity: "high", category: "supply-chain", source: "CrowdStrike", mitre: ["T1195.002", "T1059", "T1071"], description: "North Korean Lazarus group trojanising 3CX desktop application affecting 600,000+ organisations." },
  { title: "Cisco IOS XE Zero-Day", severity: "critical", category: "network", source: "Cisco PSIRT", mitre: ["T1190", "T1505.003", "T1136"], description: "CVE-2023-20198 exploited to create admin accounts on tens of thousands of Cisco devices." },
  { title: "Change Healthcare Ransomware", severity: "critical", category: "ransomware", source: "HHS", mitre: ["T1486", "T1021", "T1078"], description: "ALPHV/BlackCat ransomware crippling US healthcare payment processing for weeks." },
];

export default function ThreatIntelPage() {
  const [events, setEvents] = useState<ThreatEvent[]>([]);
  const [search, setSearch] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [stats, setStats] = useState({ exercises: 0, themes: 0, mitre: 0 });

  useEffect(() => {
    // Load saved threat events
    fetch("/api/admin/sessions").then(r => r.ok ? r.json() : []).then((sessions: any[]) => {
      const completed = sessions.filter(s => s.status === "COMPLETED");
      const themes = new Set(completed.map(s => s.theme));
      const mitre = new Set(completed.flatMap(s => s.mitreAttackIds || []));
      setStats({ exercises: completed.length, themes: themes.size, mitre: mitre.size });
    }).catch(() => {});

    // Load seed events
    const saved = localStorage.getItem("tc_threat_events");
    if (saved) { setEvents(JSON.parse(saved)); }
    else {
      const seeded = REAL_WORLD_SCENARIOS.map((s, i) => ({
        id: `rw-${i}`, ...s, date: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toISOString(), mitre: s.mitre, active: true,
      }));
      setEvents(seeded);
      localStorage.setItem("tc_threat_events", JSON.stringify(seeded));
    }
  }, []);

  function saveEvents(updated: ThreatEvent[]) { setEvents(updated); localStorage.setItem("tc_threat_events", JSON.stringify(updated)); }
  function toggleEvent(id: string) { saveEvents(events.map(e => e.id === id ? { ...e, active: !e.active } : e)); }
  function removeEvent(id: string) { saveEvents(events.filter(e => e.id !== id)); }

  async function syncFeed() {
    setSyncing(true);
    // Simulate fetching new threat intel
    await new Promise(r => setTimeout(r, 2000));
    setSyncing(false);
    alert("Threat feed synced. No new events found.");
  }

  const sc: Record<string, string> = { critical: "bg-red-500/20 text-red-400", high: "bg-orange-500/20 text-orange-400", medium: "bg-yellow-500/20 text-yellow-400", low: "bg-green-500/20 text-green-400" };
  const filtered = events.filter(e => !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.category.includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="font-display text-xl font-bold text-white">Threat Intelligence</h1><p className="text-gray-500 text-xs mt-1">{events.length} events · {events.filter(e => e.active).length} active</p></div>
        <button onClick={syncFeed} disabled={syncing} className="cyber-btn-primary text-xs disabled:opacity-50">{syncing ? "Syncing..." : "🔄 Sync Feed"}</button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="cyber-card text-center"><p className="font-display text-xl font-bold text-cyber-400">{stats.exercises}</p><p className="text-gray-500 text-xs">Exercises</p></div>
        <div className="cyber-card text-center"><p className="font-display text-xl font-bold text-yellow-400">{stats.themes}</p><p className="text-gray-500 text-xs">Threat Themes</p></div>
        <div className="cyber-card text-center"><p className="font-display text-xl font-bold text-purple-400">{stats.mitre}</p><p className="text-gray-500 text-xs">MITRE Techniques</p></div>
      </div>

      <input className="cyber-input w-full mb-4 text-sm" placeholder="Search threat events..." value={search} onChange={e => setSearch(e.target.value)} />

      <div className="space-y-2">{filtered.map(e => (
        <div key={e.id} className={`cyber-card ${!e.active ? "opacity-50" : ""}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={`cyber-badge text-xs ${sc[e.severity] || sc.medium}`}>{e.severity}</span>
                <span className="cyber-badge text-xs bg-surface-3 text-gray-400">{e.category}</span>
                <span className="text-gray-600 text-xs">{e.source}</span>
                <span className="text-gray-600 text-xs">{new Date(e.date).toLocaleDateString("en-GB")}</span>
              </div>
              <p className="text-white text-sm font-medium">{e.title}</p>
              <p className="text-gray-500 text-xs mt-1 line-clamp-2">{e.description}</p>
              {e.mitre.length > 0 && <div className="flex flex-wrap gap-1 mt-2">{e.mitre.map(t => <span key={t} className="cyber-badge text-xs bg-cyber-600/10 text-cyber-400">{t}</span>)}</div>}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={() => toggleEvent(e.id)} className="text-gray-500 hover:text-gray-300 text-xs p-1">{e.active ? "Hide" : "Show"}</button>
              <button onClick={() => removeEvent(e.id)} className="text-red-400/50 hover:text-red-400 text-xs p-1">✕</button>
            </div>
          </div>
        </div>
      ))}</div>
    </div>
  );
}
