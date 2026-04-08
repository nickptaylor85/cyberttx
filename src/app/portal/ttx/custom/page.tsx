"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface ThreatActor {
  id: string; name: string; aliases: string[]; origin: string; type: string;
  motivation: string; targets: string[]; activeSince: string;
  ttps: string[]; ttpDescriptions: string[]; notableAttacks: string[]; description: string;
}

interface TrendingActor {
  name: string; description: string; targets: string[]; ttps: string[];
}

export default function CustomScenarioPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1=scenario, 2=threat actor, 3=review+generate

  // Step 1 state
  const [incident, setIncident] = useState("");
  const [difficulty, setDifficulty] = useState("INTERMEDIATE");
  const [theme, setTheme] = useState("custom");

  // Step 2 state
  const [actors, setActors] = useState<ThreatActor[]>([]);
  const [trending, setTrending] = useState<TrendingActor[]>([]);
  const [selectedActor, setSelectedActor] = useState<ThreatActor | null>(null);
  const [selectedTrending, setSelectedTrending] = useState<TrendingActor | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loadingActors, setLoadingActors] = useState(false);
  const [loadingTrending, setLoadingTrending] = useState(false);

  // Step 3 state
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  // Load threat actors
  useEffect(() => {
    if (step === 2 && actors.length === 0) {
      setLoadingActors(true);
      fetch("/api/portal/threat-actors").then(r => r.ok ? r.json() : { actors: [] }).then((d: any) => {
        setActors(d.actors || []);
        setLoadingActors(false);
      }).catch(() => setLoadingActors(false));
    }
  }, [step]);

  function loadTrending() {
    setLoadingTrending(true);
    fetch("/api/portal/threat-actors?trending=true").then(r => r.ok ? r.json() : {}).then((d: any) => {
      setTrending(d.trending || []);
      setLoadingTrending(false);
    }).catch(() => setLoadingTrending(false));
  }

  const filteredActors = actors.filter(a => {
    if (typeFilter && a.type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return a.name.toLowerCase().includes(q) || a.aliases.some(al => al.toLowerCase().includes(q)) || a.origin.toLowerCase().includes(q) || a.targets.some(t => t.toLowerCase().includes(q));
    }
    return true;
  });

  const types = [
    { value: "", label: "All" },
    { value: "nation-state", label: "Nation-State" },
    { value: "cybercrime", label: "Cybercrime" },
    { value: "hacktivist", label: "Hacktivist" },
  ];

  async function handleGenerate() {
    setGenerating(true); setError("");
    try {
      // Build the AI prompt context from selected actor
      let actorContext = "";
      if (selectedActor) {
        actorContext = `\n\nTHREAT ACTOR CONTEXT — Base this exercise on the TTPs of ${selectedActor.name}:\n` +
          `Origin: ${selectedActor.origin}\n` +
          `Motivation: ${selectedActor.motivation}\n` +
          `Known TTPs:\n${selectedActor.ttpDescriptions.map(t => `- ${t}`).join("\n")}\n` +
          `Notable attacks: ${selectedActor.notableAttacks.join(", ")}\n` +
          `The exercise should simulate an attack using these specific techniques. Reference the threat actor by name in the scenario narrative.`;
      } else if (selectedTrending) {
        actorContext = `\n\nTHREAT ACTOR CONTEXT — Base this exercise on ${selectedTrending.name}:\n` +
          `${selectedTrending.description}\n` +
          `Targets: ${selectedTrending.targets.join(", ")}\n` +
          `Known TTPs: ${selectedTrending.ttps.join(", ")}\n` +
          `The exercise should simulate an attack using these techniques. Reference the threat actor by name.`;
      }

      const customIncident = incident + actorContext;

      const res = await fetch("/api/ttx/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme, difficulty, mode: "INDIVIDUAL", questionCount: 12,
          mitreAttackIds: selectedActor?.ttps || [],
          customIncident,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      const session = await res.json();
      router.push(`/portal/ttx/${session.id}`);
    } catch (e: any) {
      setError(e.message || "Failed to generate exercise");
      setGenerating(false);
    }
  }

  const activeActor = selectedActor || selectedTrending;
  const actorName = selectedActor?.name || selectedTrending?.name || null;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= s ? "bg-[#00ffd5] text-black" : "bg-surface-3 text-gray-500"}`}>{s}</div>
            <span className={`text-xs ${step >= s ? "text-white" : "text-gray-600"} hidden sm:inline`}>{["Scenario", "Threat Actor", "Generate"][s - 1]}</span>
            {s < 3 && <div className={`flex-1 h-0.5 ${step > s ? "bg-[#00ffd5]" : "bg-surface-3"}`} />}
          </div>
        ))}
      </div>

      {/* ═══ STEP 1: SCENARIO ═══ */}
      {step === 1 && (
        <div>
          <h1 className="font-mono text-xl font-bold text-white mb-1">Custom Exercise</h1>
          <p className="text-gray-500 text-xs mb-6">Describe your scenario. The AI will generate a full exercise from it.</p>

          <div className="space-y-4">
            <div>
              <label className="cyber-label">Incident Description</label>
              <textarea className="cyber-input w-full h-32" value={incident} onChange={e => setIncident(e.target.value)}
                placeholder="E.g. An employee receives a phone call from someone claiming to be IT support. They convince the employee to install a remote access tool. Within 30 minutes, the attacker has lateral movement across the network..." />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="cyber-label">Theme</label>
                <select className="cyber-input w-full" value={theme} onChange={e => setTheme(e.target.value)}>
                  {["custom", "ransomware", "phishing", "insider-threat", "supply-chain", "data-exfil", "apt", "cloud-breach", "ddos"].map(t => (
                    <option key={t} value={t}>{t === "custom" ? "Custom (from description)" : t.replace(/-/g, " ")}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="cyber-label">Difficulty</label>
                <select className="cyber-input w-full" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                  {["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <button onClick={() => setStep(2)} disabled={!incident.trim()} className="cyber-btn-primary disabled:opacity-50">
              Next: Choose Threat Actor →
            </button>
          </div>
        </div>
      )}

      {/* ═══ STEP 2: THREAT ACTOR ═══ */}
      {step === 2 && (
        <div>
          <h1 className="font-mono text-xl font-bold text-white mb-1">Select Threat Actor</h1>
          <p className="text-gray-500 text-xs mb-4">Choose a real threat actor and their TTPs will drive the exercise. Or skip to use your scenario as-is.</p>

          {/* Search + filter */}
          <div className="flex gap-2 mb-3">
            <input className="cyber-input flex-1 text-sm" placeholder="Search actors, targets, origins..." value={search} onChange={e => setSearch(e.target.value)} />
            <button onClick={loadTrending} disabled={loadingTrending} className="cyber-btn-secondary text-xs whitespace-nowrap">
              {loadingTrending ? "Searching..." : "🔍 Find Trending"}
            </button>
          </div>

          <div className="flex gap-1.5 mb-4">{types.map(t => (
            <button key={t.value} onClick={() => setTypeFilter(t.value)}
              className={`px-3 py-1 rounded text-xs transition-colors ${typeFilter === t.value ? "bg-[#00ffd5]/10 text-[#00ffd5] border border-[#00ffd5]/30" : "bg-surface-2 text-gray-500 border border-surface-3"}`}>
              {t.label}
            </button>
          ))}</div>

          {/* Trending actors from web search */}
          {trending.length > 0 && (
            <div className="mb-4">
              <p className="text-[#00ffd5] text-xs font-bold uppercase tracking-wider mb-2">🔥 Trending in the News</p>
              <div className="space-y-1.5">{trending.map((t, i) => (
                <button key={i} onClick={() => { setSelectedTrending(t); setSelectedActor(null); }}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${selectedTrending?.name === t.name ? "border-[#00ffd5] bg-[#00ffd5]/5" : "border-surface-3 hover:border-surface-4"}`}>
                  <p className="text-white text-sm font-semibold">{t.name}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{t.description}</p>
                  <div className="flex flex-wrap gap-1 mt-1.5">{t.ttps.slice(0, 4).map((ttp, j) => (
                    <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400">{ttp}</span>
                  ))}</div>
                </button>
              ))}</div>
            </div>
          )}

          {/* Actor list */}
          {loadingActors ? (
            <div className="text-center py-8"><p className="text-gray-500 text-sm">Loading threat actors...</p></div>
          ) : (
            <div className="space-y-1.5 max-h-96 overflow-y-auto">{filteredActors.map(actor => (
              <button key={actor.id} onClick={() => { setSelectedActor(actor); setSelectedTrending(null); }}
                className={`w-full text-left p-3 rounded-lg border transition-all ${selectedActor?.id === actor.id ? "border-[#00ffd5] bg-[#00ffd5]/5" : "border-surface-3 hover:border-surface-4"}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-white text-sm font-semibold">{actor.name}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${actor.type === "nation-state" ? "bg-red-500/10 text-red-400" : actor.type === "cybercrime" ? "bg-purple-500/10 text-purple-400" : "bg-yellow-500/10 text-yellow-400"}`}>{actor.type}</span>
                    </div>
                    <p className="text-gray-600 text-xs">{actor.origin} · Since {actor.activeSince}</p>
                    <p className="text-gray-500 text-xs mt-1 line-clamp-1">{actor.description}</p>
                  </div>
                </div>
                {selectedActor?.id === actor.id && (
                  <div className="mt-3 pt-3 border-t border-surface-3/50">
                    <p className="text-[#00ffd5] text-xs font-semibold mb-1.5">TTPs that will drive this exercise:</p>
                    <div className="flex flex-wrap gap-1">{actor.ttpDescriptions.map((ttp, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-[#00ffd5]/10 text-[#00ffd5]/80">{ttp}</span>
                    ))}</div>
                    <p className="text-gray-600 text-xs mt-2">Notable: {actor.notableAttacks.slice(0, 2).join(" · ")}</p>
                  </div>
                )}
              </button>
            ))}</div>
          )}

          <div className="flex justify-between mt-6">
            <button onClick={() => setStep(1)} className="cyber-btn-secondary">← Back</button>
            <div className="flex gap-2">
              <button onClick={() => { setSelectedActor(null); setSelectedTrending(null); setStep(3); }} className="text-gray-500 text-sm hover:text-gray-300">Skip</button>
              <button onClick={() => setStep(3)} disabled={!activeActor} className="cyber-btn-primary disabled:opacity-50">
                Next: Review →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ STEP 3: REVIEW + GENERATE ═══ */}
      {step === 3 && (
        <div>
          <h1 className="font-mono text-xl font-bold text-white mb-1">Review & Generate</h1>
          <p className="text-gray-500 text-xs mb-6">Check your exercise configuration and hit generate.</p>

          <div className="space-y-3">
            <div className="cyber-card">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Scenario</p>
              <p className="text-white text-sm">{incident}</p>
              <div className="flex gap-2 mt-2">
                <span className="cyber-badge text-xs bg-surface-3 text-gray-400 capitalize">{theme.replace(/-/g, " ")}</span>
                <span className="cyber-badge text-xs bg-surface-3 text-gray-400">{difficulty}</span>
              </div>
            </div>

            {actorName && (
              <div className="cyber-card border-[#00ffd5]/20 bg-[#00ffd5]/5">
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Threat Actor</p>
                <p className="text-[#00ffd5] text-sm font-bold">{actorName}</p>
                {selectedActor && (
                  <>
                    <p className="text-gray-400 text-xs mt-1">{selectedActor.origin} · {selectedActor.motivation}</p>
                    <div className="flex flex-wrap gap-1 mt-2">{selectedActor.ttpDescriptions.slice(0, 5).map((t, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-[#00ffd5]/10 text-[#00ffd5]/70">{t}</span>
                    ))}</div>
                  </>
                )}
                {selectedTrending && (
                  <>
                    <p className="text-gray-400 text-xs mt-1">{selectedTrending.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">{selectedTrending.ttps.slice(0, 5).map((t, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-[#00ffd5]/10 text-[#00ffd5]/70">{t}</span>
                    ))}</div>
                  </>
                )}
              </div>
            )}

            {!actorName && (
              <div className="cyber-card border-surface-3">
                <p className="text-gray-500 text-xs">No threat actor selected — exercise will use your scenario description as-is.</p>
              </div>
            )}
          </div>

          {error && <p className="text-red-400 text-xs mt-3">{error}</p>}

          <div className="flex justify-between mt-6">
            <button onClick={() => setStep(2)} className="cyber-btn-secondary">← Back</button>
            <button onClick={handleGenerate} disabled={generating} className="cyber-btn-primary disabled:opacity-50">
              {generating ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating exercise...
                </span>
              ) : (
                `Generate Exercise${actorName ? ` (${actorName.split(" ")[0]} TTPs)` : ""}`
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
