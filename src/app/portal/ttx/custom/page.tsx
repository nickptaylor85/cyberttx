"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface TrendingActor {
  name: string; description: string; targets: string[]; ttps: string[];
}

export default function CustomScenarioPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1=scenario, 2=review+generate

  // Step 1 state
  const [incident, setIncident] = useState("");
  const [difficulty, setDifficulty] = useState("INTERMEDIATE");
  const [theme, setTheme] = useState("custom");

  // Step 2 state
  const [search, setSearch] = useState("");
  const [loadingActors, setLoadingActors] = useState(false);

  // Step 3 state
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");



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
      const customIncident = incident;

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
              Review & Generate →
            </button>
          </div>
        </div>
      )}

      {/* ═══ STEP 2: THREAT ACTOR ═══ */}
      {step === 2 && (
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

              <div className="cyber-card border-[#00ffd5]/20 bg-[#00ffd5]/5">
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Threat Actor</p>
                {selectedActor && (
                  <>
                    <p className="text-gray-400 text-xs mt-1">{selectedActor.origin} · {selectedActor.motivation}</p>
                    <div className="flex flex-wrap gap-1 mt-2">{selectedActor.ttpDescriptions.slice(0, 5).map((t, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-[#00ffd5]/10 text-[#00ffd5]/70">{t}</span>
                    ))}</div>
                  </>
                )}
                  <>
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-[#00ffd5]/10 text-[#00ffd5]/70">{t}</span>
                    ))}</div>
                  </>
                )}
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
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
