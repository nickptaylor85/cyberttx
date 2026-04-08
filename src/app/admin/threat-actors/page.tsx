"use client";
import { useState, useEffect } from "react";

interface ThreatActor { id: string; name: string; aliases: string[]; origin: string; type: string; motivation: string; targets: string[]; activeSince: string; ttps: string[]; notableAttacks: string[]; description: string; isCustom?: boolean; }

const EXTRA_ACTORS = [
  { name: "Storm-0558", origin: "China (MSS)", type: "nation-state", motivation: "Espionage", targets: ["Government", "Diplomacy"], activeSince: "2023", description: "Forged Azure AD signing keys to access US government email accounts.", notableAttacks: ["Microsoft cloud email breach (2023)"], aliases: [], ttps: [], ttpDescriptions: [] },
  { name: "Black Basta", origin: "Russia", type: "cybercrime", motivation: "RaaS", targets: ["Healthcare", "Manufacturing"], activeSince: "2022", description: "Ex-Conti operators. Double extortion ransomware.", notableAttacks: ["Ascension Health (2024)", "ABB Ltd (2023)"], aliases: [], ttps: [], ttpDescriptions: [] },
  { name: "Akira", origin: "Unknown", type: "cybercrime", motivation: "RaaS", targets: ["Education", "Healthcare"], activeSince: "2023", description: "Exploiting Cisco VPN vulnerabilities for initial access.", notableAttacks: ["Stanford University (2023)", "Nissan Oceania (2023)"], aliases: [], ttps: [], ttpDescriptions: [] },
  { name: "Medusa", origin: "Unknown", type: "cybercrime", motivation: "RaaS", targets: ["Education", "Healthcare", "Government"], activeSince: "2022", description: "Multi-million dollar ransoms with dedicated leak site.", notableAttacks: ["Minneapolis Public Schools (2023)", "Toyota Financial Services (2023)"], aliases: ["MedusaLocker"], ttps: [], ttpDescriptions: [] },
  { name: "NoName057(16)", origin: "Russia", type: "hacktivist", motivation: "Pro-Russia hacktivism", targets: ["Government", "Finance", "Transport"], activeSince: "2022", description: "DDoS group targeting NATO countries with Project DDoSia.", notableAttacks: ["Czech government (2023)", "Swiss government (2024)"], aliases: ["NoName"], ttps: [], ttpDescriptions: [] },
  { name: "Play Ransomware", origin: "Unknown", type: "cybercrime", motivation: "RaaS", targets: ["Government", "Manufacturing"], activeSince: "2022", description: "Exploiting FortiOS and Microsoft Exchange vulnerabilities.", notableAttacks: ["City of Oakland (2023)", "Rackspace (2022)"], aliases: ["PlayCrypt"], ttps: [], ttpDescriptions: [] },
  { name: "Hunters International", origin: "Unknown", type: "cybercrime", motivation: "RaaS", targets: ["Healthcare", "Manufacturing"], activeSince: "2023", description: "Successor to Hive ransomware. Data exfiltration focus.", notableAttacks: ["Fred Hutchinson Cancer Center (2023)"], aliases: [], ttps: [], ttpDescriptions: [] },
  { name: "CyberAv3ngers", origin: "Iran (IRGC)", type: "hacktivist", motivation: "Anti-Israel", targets: ["Water", "Energy", "Critical Infrastructure"], activeSince: "2023", description: "Targeting Israeli-made Unitronics PLCs in water facilities.", notableAttacks: ["Aliquippa PA water (2023)", "UK water facilities (2024)"], aliases: ["IRGC-CEC"], ttps: [], ttpDescriptions: [] },
  { name: "Qilin", origin: "Russia", type: "cybercrime", motivation: "RaaS", targets: ["Healthcare", "Manufacturing"], activeSince: "2022", description: "Attacked NHS pathology provider Synnovis, disrupting London hospitals.", notableAttacks: ["Synnovis/NHS (2024)", "Yanfeng Automotive (2023)"], aliases: ["Agenda"], ttps: [], ttpDescriptions: [] },
  { name: "Embargo", origin: "Unknown", type: "cybercrime", motivation: "RaaS", targets: ["Healthcare", "Technology"], activeSince: "2024", description: "New Rust-based ransomware with endpoint security killer toolkit.", notableAttacks: ["US healthcare orgs (2024)"], aliases: [], ttps: [], ttpDescriptions: [] },
];

export default function AdminThreatActorsPage() {
  const [actors, setActors] = useState<ThreatActor[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);
  const [addedNames, setAddedNames] = useState<Set<string>>(new Set());

  function loadActors() {
    fetch("/api/portal/threat-actors").then(r => r.ok ? r.json() : { actors: [] }).then((d: any) => {
      setActors(d.actors || []);
      setLoading(false);
    });
  }

  useEffect(() => { loadActors(); }, []);

  async function addActor(actor: any) {
    setAdding(actor.name);
    try {
      const res = await fetch("/api/portal/threat-actors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(actor),
      });
      if (res.ok || res.status === 409) {
        setAddedNames(prev => new Set([...prev, actor.name.toLowerCase()]));
        loadActors();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to add");
      }
    } catch { alert("Failed to add actor"); }
    setAdding(null);
  }

  const actorNames = new Set(actors.map(a => a.name.toLowerCase()));
  const availableExtras = EXTRA_ACTORS.filter(a => !actorNames.has(a.name.toLowerCase()) && !addedNames.has(a.name.toLowerCase()));

  const types = ["ALL", ...new Set(actors.map(a => a.type))];
  const filtered = actors.filter(a => {
    if (typeFilter !== "ALL" && a.type !== typeFilter) return false;
    if (search && !a.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const tc: Record<string, string> = { "nation-state": "bg-red-500/20 text-red-400", "cybercrime": "bg-orange-500/20 text-orange-400", "hacktivist": "bg-yellow-500/20 text-yellow-400" };

  if (loading) return <div className="text-center py-20 text-gray-500">Loading...</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-xl font-bold text-white">Threat Actors</h1>
        <p className="text-gray-500 text-xs mt-1">{actors.length} actors available for exercises</p>
      </div>

      {/* Add new actors section — always visible if extras available */}
      {availableExtras.length > 0 && (
        <div className="cyber-card border-[#00ffd5]/20 bg-[#00ffd5]/5 mb-6">
          <h2 className="text-[#00ffd5] text-sm font-semibold mb-3">+ Add Threat Actors to Your Database</h2>
          <p className="text-gray-400 text-xs mb-3">{availableExtras.length} actors available to add. Click to include them in exercise scenarios.</p>
          <div className="space-y-2">
            {availableExtras.map((actor, i) => (
              <div key={i} className="p-3 bg-surface-2 rounded-lg border border-surface-3 flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-white text-sm font-medium">{actor.name}</p>
                    <span className={"cyber-badge text-xs " + (tc[actor.type] || "bg-gray-500/20 text-gray-400")}>{actor.type}</span>
                    <span className="text-gray-600 text-xs">{actor.origin}</span>
                  </div>
                  <p className="text-gray-400 text-xs mt-1">{actor.description}</p>
                  {actor.notableAttacks.length > 0 && <p className="text-[#00ffd5] text-xs mt-0.5">{actor.notableAttacks.join(" · ")}</p>}
                </div>
                <button onClick={() => addActor(actor)} disabled={adding === actor.name}
                  className="cyber-btn-primary text-xs py-1.5 px-4 flex-shrink-0 whitespace-nowrap">
                  {adding === actor.name ? "Adding..." : "+ Add"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {addedNames.size > 0 && availableExtras.length === 0 && (
        <div className="cyber-card border-green-500/20 bg-green-600/5 mb-4">
          <p className="text-green-400 text-sm">✅ All available actors have been added to your database.</p>
        </div>
      )}

      {/* Search + filter */}
      <div className="flex gap-2 mb-4">
        <input className="cyber-input flex-1 text-sm" placeholder="Search actors..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="cyber-input text-sm w-auto" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          {types.map(t => <option key={t} value={t}>{t === "ALL" ? "All Types" : t}</option>)}
        </select>
      </div>

      {/* Actor list */}
      <div className="space-y-2">
        {filtered.map(actor => (
          <div key={actor.id} className={"cyber-card" + ((actor as any).isCustom ? " border-purple-500/10" : "")}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-white text-sm font-semibold">{actor.name}</p>
                  <span className={"cyber-badge text-xs " + (tc[actor.type] || "bg-gray-500/20 text-gray-400")}>{actor.type}</span>
                  {(actor as any).isCustom && <span className="cyber-badge text-xs bg-purple-500/20 text-purple-400">added</span>}
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
  );
}
