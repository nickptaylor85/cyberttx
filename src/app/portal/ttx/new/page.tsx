"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TTX_THEMES, COMMON_MITRE_TECHNIQUES, MITRE_TACTICS } from "@/types";
import { cn } from "@/lib/utils";
import type { ThreatActor } from "@/lib/threat-actors";

interface Tool {
  id: string;
  name: string;
  vendor: string;
  category: string;
  icon: string;
}

interface Character {
  id: string;
  name: string;
  role: string;
  department: string;
  description: string;
  expertise: string[];
  isRecurring: boolean;
}

// One-off character (not saved to roster)
interface AdHocCharacter {
  tempId: string;
  name: string;
  role: string;
  department: string;
  description: string;
}

const LOADING_CONTENT = [
  { type: "tip", icon: "🛡️", text: "The average cost of a data breach in 2024 was $4.88 million — the highest ever recorded.", source: "IBM" },
  { type: "tip", icon: "⏱️", text: "It takes an average of 194 days to identify a breach and 68 days to contain it.", source: "IBM" },
  { type: "actor", icon: "🕵️", text: "APT29 (Cozy Bear) — Russia's SVR. Responsible for the SolarWinds attack that compromised 18,000 organisations.", source: "" },
  { type: "tip", icon: "🔑", text: "80% of breaches involve compromised credentials. MFA blocks 99.9% of automated attacks.", source: "Microsoft" },
  { type: "actor", icon: "⚔️", text: "Scattered Spider — teenage hackers who social-engineered MGM Resorts with a 10-minute phone call. $100M+ in losses.", source: "" },
  { type: "tip", icon: "📧", text: "Phishing is the initial attack vector in 36% of all breaches. It takes just one click.", source: "Verizon DBIR" },
  { type: "actor", icon: "💀", text: "LockBit — the most prolific ransomware group, responsible for 1,700+ attacks before being disrupted by Operation Cronos.", source: "" },
  { type: "tip", icon: "🏭", text: "Ransomware attacks against critical infrastructure increased 87% in 2023.", source: "CISA" },
  { type: "actor", icon: "🐉", text: "Volt Typhoon — Chinese group pre-positioning in US critical infrastructure using living-off-the-land techniques. Almost undetectable.", source: "" },
  { type: "tip", icon: "💰", text: "The average ransomware payment in 2024 was $2.73 million — up 500% from the previous year.", source: "Sophos" },
  { type: "actor", icon: "🇰🇵", text: "Lazarus Group — North Korea's cyber unit. Stole $625M from the Ronin Bridge and funded the regime's nuclear programme.", source: "" },
  { type: "tip", icon: "🔒", text: "95% of cybersecurity breaches are caused by human error. Training is your strongest defence.", source: "WEF" },
  { type: "actor", icon: "🌊", text: "CL0P exploited the MOVEit zero-day to steal data from 2,500+ organisations in a single campaign — Shell, BBC, US government.", source: "" },
  { type: "tip", icon: "🏥", text: "Healthcare is the most expensive industry for breaches at $10.93M per incident on average.", source: "IBM" },
  { type: "actor", icon: "🔥", text: "Sandworm (Russia) — destroyed 35,000 workstations at Saudi Aramco and caused $10B+ damage with NotPetya.", source: "" },
  { type: "tip", icon: "☁️", text: "82% of breaches involve data stored in the cloud. Misconfiguration is the #1 cloud security risk.", source: "IBM" },
];

const WIZARD_STEPS = ["Theme", "Threat Actor", "Configuration", "Characters", "MITRE ATT&CK", "Launch"];

export default function NewTtxPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [tools, setTools] = useState<Tool[]>([]);
  const [orgTools, setOrgTools] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
  const [mitreStats, setMitreStats] = useState<{ mostUsed: string[]; leastUsed: string[] }>({ mostUsed: [], leastUsed: [] });
  const [error, setError] = useState("");
  const [threatActors, setThreatActors] = useState<ThreatActor[]>([]);
  const [trendingActors, setTrendingActors] = useState<any[]>([]);
  const [selectedActor, setSelectedActor] = useState<ThreatActor | null>(null);
  const [actorSearch, setActorSearch] = useState("");
  const [loadingTrending, setLoadingTrending] = useState(false);

  // Characters from roster
  const [rosterCharacters, setRosterCharacters] = useState<Character[]>([]);
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<Set<string>>(new Set());

  // One-off characters for this session only
  const [adHocCharacters, setAdHocCharacters] = useState<AdHocCharacter[]>([]);
  const [showAdHocForm, setShowAdHocForm] = useState(false);
  const [adHocForm, setAdHocForm] = useState({ name: "", role: "", department: "", description: "" });

  const [config, setConfig] = useState({
    theme: "",
    threatActorId: "" as string,
    difficulty: "INTERMEDIATE" as string,
    mode: "GROUP" as string,
    questionCount: 8,
    mitreAttackIds: [] as string[],
    timeLimitSecs: null as number | null,
  });

  // fromAlert is now handled directly in the Alert Feed page
  // (calls /api/ttx/generate and redirects to the exercise)

  // Rotate tips while generating
  useEffect(() => {
    if (!generating) return;
    const interval = setInterval(() => setTipIndex(i => (i + 1) % LOADING_CONTENT.length), 8000);
    return () => clearInterval(interval);
  }, [generating]);

  // Load threat actors when entering step 2
  useEffect(() => {
    if (step === 2 && threatActors.length === 0) {
      fetch("/api/portal/threat-actors").then(r => r.ok ? r.json() : { actors: [] }).then((d: any) => setThreatActors(d.actors || []));
    }
  }, [step]);

  useEffect(() => {
    // Fetch MITRE technique usage for this portal
    fetch("/api/portal/sessions").then(r => r.ok ? r.json() : []).then(sessions => {
      const techCounts: Record<string, number> = {};
      (sessions || []).forEach((s: any) => {
        (s.mitreAttackIds || []).forEach((t: string) => { techCounts[t] = (techCounts[t] || 0) + 1; });
      });
      const sorted = Object.entries(techCounts).sort((a, b) => b[1] - a[1]);
      setMitreStats({
        mostUsed: sorted.slice(0, 5).map(([t]) => t),
        leastUsed: sorted.slice(-5).map(([t]) => t),
      });
    }).catch(() => {});
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/portal/tools").then((r) => r.json()),
      fetch("/api/portal/characters").then((r) => r.json()),
    ]).then(([toolsData, charsData]) => {
      setTools(toolsData.allTools || []);
      setOrgTools(toolsData.selectedIds || []);
      setRosterCharacters(charsData || []);
      // Pre-select recurring characters
      const recurring = (charsData || []).filter((c: Character) => c.isRecurring).map((c: Character) => c.id);
      setSelectedCharacterIds(new Set(recurring));
      setLoading(false);
    });
  }, []);

  function toggleCharacter(id: string) {
    const next = new Set(selectedCharacterIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedCharacterIds(next);
  }

  function addAdHocCharacter(e: React.FormEvent) {
    e.preventDefault();
    if (!adHocForm.name || !adHocForm.role) return;
    setAdHocCharacters([...adHocCharacters, { ...adHocForm, tempId: `adhoc-${Date.now()}` }]);
    setAdHocForm({ name: "", role: "", department: "", description: "" });
    setShowAdHocForm(false);
  }

  function removeAdHoc(tempId: string) {
    setAdHocCharacters(adHocCharacters.filter((c) => c.tempId !== tempId));
  }

  async function handleGenerate() {
    setGenerating(true);
    setError("");

    const selectedRoster = rosterCharacters
      .filter((c) => selectedCharacterIds.has(c.id))
      .map((c) => ({
        name: c.name, role: c.role, department: c.department || "",
        description: c.description || "", expertise: c.expertise || [],
      }));

    const adHocPayload = adHocCharacters.map((c) => ({
      name: c.name, role: c.role, department: c.department || "",
      description: c.description || "", expertise: [],
    }));

    try {
      // Step 1: Create session (returns immediately)
      const res = await fetch("/api/ttx/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...config,
          toolIds: orgTools,
          selectedCharacters: [...selectedRoster, ...adHocPayload],
          language: document.cookie.match(/lang=(\w+)/)?.[1] || "en",
          threatActorId: config.threatActorId || undefined,
          customIncident: (window as any).__alertIncident || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Generation failed");
      }
      const { id: sessionId } = await res.json();

      // Step 2: Poll for completion every 3 seconds
      const maxPolls = 40; // 40 * 3s = 2 minutes max
      for (let i = 0; i < maxPolls; i++) {
        await new Promise(r => setTimeout(r, 3000));
        try {
          const poll = await fetch(`/api/ttx/session/${sessionId}`);
          if (poll.ok) {
            const data = await poll.json();
            if (data.status === "LOBBY" || data.status === "IN_PROGRESS" || data.status === "COMPLETED") {
              router.push(`/portal/ttx/${sessionId}`);
              return;
            }
            if (data.status === "CANCELLED") {
              throw new Error("Generation failed — the AI couldn't produce a valid scenario. Try again with fewer questions or a different theme.");
            }
          }
        } catch (pollErr: any) {
          if (pollErr?.message?.includes("Generation failed")) throw pollErr;
          // Network blip — keep polling
        }
      }
      throw new Error("Generation timed out. Try again with fewer questions.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate");
      setGenerating(false);
    }
  }

  const selectedTheme = TTX_THEMES.find((t) => t.id === config.theme);
  const groupedTechniques = MITRE_TACTICS.map((tactic) => ({
    tactic,
    techniques: COMMON_MITRE_TECHNIQUES.filter((t) => t.tactic === tactic),
  })).filter((g) => g.techniques.length > 0);

  const totalCharacters = selectedCharacterIds.size + adHocCharacters.length;

  if (loading) {
    return <div className="text-center py-20 text-gray-500">Loading configuration...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Full-screen generating overlay */}
      {generating && (
        <div className="fixed inset-0 z-50 bg-[#030712] flex flex-col items-center justify-center px-6">
          {/* Animated shield */}
          <div className="relative mb-8">
            <div className="w-20 h-20 rounded-2xl bg-[#00ffd5]/5 border border-[#00ffd5]/20 flex items-center justify-center animate-pulse">
              <svg className="w-10 h-10" viewBox="0 0 120 120" fill="none">
                <path d="M60 14 L30 29 L26 74 L60 104 L94 74 L90 29 Z" fill="rgba(0,255,213,0.06)" stroke="#00ffd5" strokeWidth="2"/>
                <path d="M51 56 L57 63 L70 48" fill="none" stroke="#00ffd5" strokeWidth="3" strokeLinecap="square"/>
              </svg>
            </div>
            <div className="absolute -inset-4 rounded-3xl bg-[#00ffd5]/5 animate-ping" style={{ animationDuration: "2s" }} />
          </div>

          <p className="font-mono text-sm font-bold tracking-wider mb-2">
            <span className="text-gray-100">THREAT</span><span className="text-[#00ffd5]">CAST</span>
          </p>
          <p className="text-[#00ffd5] text-sm font-semibold mb-1">Generating Your Scenario</p>
          <p className="text-gray-500 text-xs mb-8">
            {selectedTheme?.icon} {selectedTheme?.name} · {config.difficulty} · {config.questionCount} questions
          </p>

          {/* Progress bar */}
          <div className="w-64 h-1 bg-surface-3 rounded-full mb-10 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#00ffd5] to-[#14b89a] rounded-full animate-loading-bar" style={{ animation: "loading-bar 40s ease-in-out forwards" }} />
          </div>

          {/* Rotating tips */}
          <div className="max-w-md text-center min-h-[100px] flex flex-col items-center justify-center">
            <p className="text-2xl mb-3">{LOADING_CONTENT[tipIndex].icon}</p>
            <p className="text-gray-300 text-sm leading-relaxed">{LOADING_CONTENT[tipIndex].text}</p>
            {LOADING_CONTENT[tipIndex].source && (
              <p className="text-gray-600 text-xs mt-2">— {LOADING_CONTENT[tipIndex].source}</p>
            )}
            <p className="text-gray-700 text-xs mt-1 uppercase tracking-wider">
              {LOADING_CONTENT[tipIndex].type === "actor" ? "Threat Actor Intel" : "Cyber Security Fact"}
            </p>
          </div>

          {/* Dots indicator */}
          <div className="flex gap-1.5 mt-6">
            {LOADING_CONTENT.map((_, i) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === tipIndex ? "bg-[#00ffd5] w-4" : "bg-surface-3"}`} />
            ))}
          </div>

          <p className="text-gray-600 text-xs mt-8">Typically takes 30-50 seconds</p>
        </div>
      )}

      <h1 className="font-display text-2xl font-bold text-white mb-2">Create New Exercise</h1>
      <p className="text-gray-500 text-sm mb-8">Configure your tabletop exercise and let AI generate the scenario.</p>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 mb-10">
        {WIZARD_STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all",
              step > i + 1 ? "bg-cyber-600 text-white" :
              step === i + 1 ? "bg-cyber-600/20 text-cyber-400 border border-cyber-600" :
              "bg-surface-3 text-gray-500"
            )}>
              {step > i + 1 ? "✓" : i + 1}
            </div>
            <span className={cn("text-sm hidden sm:block", step === i + 1 ? "text-white" : "text-gray-500")}>{label}</span>
            {i < WIZARD_STEPS.length - 1 && <div className={cn("flex-1 h-px", step > i + 1 ? "bg-cyber-600" : "bg-surface-3")} />}
          </div>
        ))}
      </div>

      {/* =============================== */}
      {/* STEP 1: Theme                    */}
      {/* =============================== */}
      {step === 1 && (
        <div>
          <h2 className="font-display text-lg font-semibold text-white mb-4">Choose a Scenario Theme</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {TTX_THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => setConfig({ ...config, theme: theme.id })}
                className={cn(
                  "cyber-card text-left cursor-pointer transition-all",
                  config.theme === theme.id
                    ? "border-cyber-500 bg-cyber-600/10 ring-1 ring-cyber-500/30"
                    : "hover:border-surface-4"
                )}
              >
                <span className="text-2xl">{theme.icon}</span>
                <p className="text-white text-sm font-medium mt-2">{theme.name}</p>
                <p className="text-gray-500 text-xs mt-1">{theme.description}</p>
              </button>
            ))}
          </div>
          <div className="flex justify-end mt-8">
            <button onClick={() => setStep(2)} disabled={!config.theme} className="cyber-btn-primary disabled:opacity-50">
              Next: Threat Actor →
            </button>
          </div>
        </div>
      )}

      {/* =============================== */}
      {/* STEP 2: Threat Actor              */}
      {/* =============================== */}
      {step === 2 && (
        <div>
          <h2 className="font-display text-lg font-semibold text-white mb-4">Select a Threat Actor (Optional)</h2>
          <p className="text-gray-500 text-sm mb-4">Model the attack after a real-world threat group. The AI will use their known TTPs and attack patterns.</p>

          <input className="cyber-input w-full mb-4" placeholder="Search threat actors..." value={actorSearch}
            onChange={e => { setActorSearch(e.target.value); if (e.target.value.length > 1) { fetch(`/api/portal/threat-actors?search=${e.target.value}`).then(r => r.ok ? r.json() : { actors: [] }).then((d: any) => setThreatActors(d.actors || [])); } else if (e.target.value === "") { fetch("/api/portal/threat-actors").then(r => r.ok ? r.json() : { actors: [] }).then((d: any) => setThreatActors(d.actors || [])); } }} />

          {selectedActor && (
            <div className="cyber-card border-purple-500/30 bg-purple-600/5 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white text-sm font-semibold">{selectedActor.name}</p>
                  <p className="text-purple-400 text-xs">{selectedActor.origin} · {selectedActor.motivation}</p>
                </div>
                <button onClick={() => { setSelectedActor(null); setConfig({ ...config, threatActorId: "" }); }} className="text-red-400 text-xs hover:text-red-300">Remove ×</button>
              </div>
              <p className="text-gray-400 text-xs mt-2">{selectedActor.description}</p>
              {selectedActor.notableAttacks?.length > 0 && <p className="text-gray-500 text-xs mt-1">Known for: {selectedActor.notableAttacks.slice(0, 3).join(", ")}</p>}
            </div>
          )}

          {!selectedActor && (
            <>
              {/* Top actors grid — always shown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {(threatActors.length > 0 ? threatActors : []).slice(0, 12).map(actor => (
                  <button key={actor.id} onClick={() => { setSelectedActor(actor); setConfig({ ...config, threatActorId: actor.id }); }}
                    className="cyber-card text-left cursor-pointer transition-all hover:border-surface-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-white text-sm font-medium">{actor.name}</p>
                        <p className="text-gray-500 text-xs">{actor.origin} · {actor.motivation}</p>
                      </div>
                      <span className={`cyber-badge text-xs ${actor.type === "nation-state" ? "bg-red-500/20 text-red-400" : actor.type === "cybercrime" ? "bg-orange-500/20 text-orange-400" : "bg-yellow-500/20 text-yellow-400"}`}>{actor.type}</span>
                    </div>
                    <p className="text-gray-600 text-xs mt-1 line-clamp-1">{actor.description}</p>
                    {actor.notableAttacks?.length > 0 && <p className="text-[#00ffd5] text-xs mt-1 line-clamp-1">{actor.notableAttacks.slice(0, 2).join(" · ")}</p>}
                  </button>
                ))}
              </div>

              {threatActors.length === 0 && (
                <div className="cyber-card text-center py-6 mb-4">
                  <p className="text-gray-500 text-sm">Loading threat actors...</p>
                </div>
              )}
            </>
          )}

          <div className="flex justify-between mt-8">
            <button onClick={() => setStep(1)} className="cyber-btn-secondary">← Back</button>
            <div className="flex gap-2">
              {!selectedActor && <button onClick={() => setStep(3)} className="cyber-btn-secondary">Skip →</button>}
              <button onClick={() => setStep(3)} className="cyber-btn-primary">{selectedActor ? "Next: Configuration →" : "Next →"}</button>
            </div>
          </div>
        </div>
      )}

      {/* =============================== */}
      {/* STEP 3: Configuration            */}
      {/* =============================== */}
      {step === 3 && (
        <div className="space-y-6">
          <h2 className="font-display text-lg font-semibold text-white mb-4">Exercise Configuration</h2>

          {/* Difficulty */}
          <div>
            <label className="cyber-label">Difficulty Level</label>
            <div className="grid grid-cols-4 gap-3">
              {[
                { value: "BEGINNER", label: "Beginner", desc: "0-2 yrs" },
                { value: "INTERMEDIATE", label: "Intermediate", desc: "2-5 yrs" },
                { value: "ADVANCED", label: "Advanced", desc: "5-10 yrs" },
                { value: "EXPERT", label: "Expert", desc: "10+ yrs" },
              ].map((d) => (
                <button
                  key={d.value}
                  onClick={() => setConfig({ ...config, difficulty: d.value })}
                  className={cn(
                    "p-3 rounded-lg border text-left transition-all",
                    config.difficulty === d.value
                      ? "border-cyber-500 bg-cyber-600/10"
                      : "border-surface-3 bg-surface-2 hover:border-surface-4"
                  )}
                >
                  <p className="text-white text-sm font-medium">{d.label}</p>
                  <p className="text-gray-500 text-xs">{d.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Mode */}
          <div>
            <label className="cyber-label">Exercise Mode</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "INDIVIDUAL", label: "Individual", desc: "Solo exercise, self-paced", icon: "👤" },
                { value: "GROUP", label: "Group (Real-time)", desc: "Multiplayer with live scoring", icon: "👥" },
              ].map((m) => (
                <button
                  key={m.value}
                  onClick={() => setConfig({ ...config, mode: m.value })}
                  className={cn(
                    "p-4 rounded-lg border text-left transition-all flex items-center gap-4",
                    config.mode === m.value
                      ? "border-cyber-500 bg-cyber-600/10"
                      : "border-surface-3 bg-surface-2 hover:border-surface-4"
                  )}
                >
                  <span className="text-2xl">{m.icon}</span>
                  <div>
                    <p className="text-white text-sm font-medium">{m.label}</p>
                    <p className="text-gray-500 text-xs">{m.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Question Count */}
          <div>
            <label className="cyber-label">Number of Questions: {config.questionCount}</label>
            <input
              type="range" min={6} max={12} value={config.questionCount}
              onChange={(e) => setConfig({ ...config, questionCount: parseInt(e.target.value) })}
              className="w-full accent-cyber-500"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>6 (Quick)</span><span>12 (Deep)</span>
            </div>
          </div>

          <div className="flex justify-between mt-8">
            <button onClick={() => setStep(2)} className="cyber-btn-secondary">← Back</button>
            <button onClick={() => setStep(4)} className="cyber-btn-primary">Next: Characters →</button>
          </div>
        </div>
      )}

      {/* =============================== */}
      {/* STEP 4: Characters               */}
      {/* =============================== */}
      {step === 4 && (
        <div>
          <h2 className="font-display text-lg font-semibold text-white mb-1">Cast Your Scenario</h2>
          <p className="text-gray-500 text-sm mb-6">
            Pick characters from your roster to appear in this exercise, or add one-off characters just for this session.
            The AI will weave them into the narrative by name.
          </p>

          {/* Roster characters */}
          {rosterCharacters.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Your Roster</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedCharacterIds(new Set(rosterCharacters.map((c) => c.id)))}
                    className="text-cyber-400 text-xs hover:text-cyber-300"
                  >
                    Select All
                  </button>
                  <span className="text-gray-600 text-xs">·</span>
                  <button
                    onClick={() => setSelectedCharacterIds(new Set())}
                    className="text-gray-400 text-xs hover:text-gray-300"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-2">
                {rosterCharacters.map((char) => {
                  const selected = selectedCharacterIds.has(char.id);
                  return (
                    <button
                      key={char.id}
                      onClick={() => toggleCharacter(char.id)}
                      className={cn(
                        "p-4 rounded-lg border text-left transition-all",
                        selected
                          ? "bg-cyber-600/10 border-cyber-600/50 ring-1 ring-cyber-500/20"
                          : "bg-surface-2 border-surface-3 hover:border-surface-4"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all",
                          selected ? "bg-cyber-600 border-cyber-600 text-white" : "border-surface-4"
                        )}>
                          {selected && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={cn("font-medium text-sm", selected ? "text-white" : "text-gray-300")}>{char.name}</p>
                          <p className="text-cyber-400 text-xs">{char.role}</p>
                          {char.department && <p className="text-gray-500 text-xs">{char.department}</p>}
                          {char.description && (
                            <p className="text-gray-500 text-xs mt-1 line-clamp-1">{char.description}</p>
                          )}
                          {char.expertise?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {char.expertise.slice(0, 3).map((exp, i) => (
                                <span key={i} className="px-1.5 py-0.5 bg-surface-3 rounded text-[10px] text-gray-400">{exp}</span>
                              ))}
                              {char.expertise.length > 3 && (
                                <span className="text-[10px] text-gray-500">+{char.expertise.length - 3}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {rosterCharacters.length === 0 && (
            <div className="mb-6 p-6 bg-surface-2 border border-surface-3 rounded-xl text-center">
              <p className="text-gray-400 text-sm mb-1">No characters in your roster yet</p>
              <p className="text-gray-500 text-xs">
                <a href="/portal/characters" className="text-cyber-400 hover:text-cyber-300">Create recurring characters →</a> or add one-off characters below.
              </p>
            </div>
          )}

          {/* Ad-hoc characters for this session */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Session-Only Characters</h3>
              <button onClick={() => setShowAdHocForm(true)} className="text-cyber-400 text-xs hover:text-cyber-300">
                + Add Character
              </button>
            </div>

            {adHocCharacters.length > 0 && (
              <div className="space-y-2 mb-3">
                {adHocCharacters.map((char) => (
                  <div key={char.tempId} className="flex items-center justify-between p-3 bg-surface-2 border border-surface-3 rounded-lg">
                    <div>
                      <p className="text-white text-sm font-medium">{char.name}</p>
                      <p className="text-cyber-400 text-xs">{char.role}{char.department ? ` · ${char.department}` : ""}</p>
                      {char.description && <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{char.description}</p>}
                    </div>
                    <button onClick={() => removeAdHoc(char.tempId)} className="text-gray-500 hover:text-red-400 p-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Ad-hoc form */}
            {showAdHocForm && (
              <form onSubmit={addAdHocCharacter} className="p-4 bg-surface-2 border border-surface-3 rounded-xl space-y-3">
                <p className="text-white text-sm font-medium mb-2">Add a character for this session only</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="cyber-label">Name</label>
                    <input className="cyber-input" placeholder="e.g. James Thornton" value={adHocForm.name}
                      onChange={(e) => setAdHocForm({ ...adHocForm, name: e.target.value })} required />
                  </div>
                  <div>
                    <label className="cyber-label">Role</label>
                    <input className="cyber-input" placeholder="e.g. External IR Consultant" value={adHocForm.role}
                      onChange={(e) => setAdHocForm({ ...adHocForm, role: e.target.value })} required />
                  </div>
                </div>
                <div>
                  <label className="cyber-label">Department (optional)</label>
                  <input className="cyber-input" placeholder="e.g. Third-party IR firm" value={adHocForm.department}
                    onChange={(e) => setAdHocForm({ ...adHocForm, department: e.target.value })} />
                </div>
                <div>
                  <label className="cyber-label">Description (optional)</label>
                  <textarea className="cyber-input min-h-[60px]" placeholder="Brief personality/background..."
                    value={adHocForm.description} onChange={(e) => setAdHocForm({ ...adHocForm, description: e.target.value })} />
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowAdHocForm(false)} className="cyber-btn-secondary text-xs flex-1">Cancel</button>
                  <button type="submit" className="cyber-btn-primary text-xs flex-1">Add to Scenario</button>
                </div>
              </form>
            )}
          </div>

          {/* Summary */}
          <div className="p-3 bg-surface-2 border border-surface-3 rounded-lg flex items-center justify-between">
            <p className="text-gray-400 text-sm">
              <span className="text-white font-semibold">{totalCharacters}</span> character{totalCharacters !== 1 ? "s" : ""} will appear in this scenario
            </p>
            {totalCharacters === 0 && (
              <span className="text-yellow-400 text-xs">AI will use generic roles</span>
            )}
          </div>

          <div className="flex justify-between mt-8">
            <button onClick={() => setStep(3)} className="cyber-btn-secondary">← Back</button>
            <button onClick={() => setStep(5)} className="cyber-btn-primary">Next: MITRE ATT&CK →</button>
          </div>
        </div>
      )}

      {/* =============================== */}
      {/* STEP 5: MITRE ATT&CK             */}
      {/* =============================== */}
      {step === 5 && (
        <div>
          <h2 className="font-display text-lg font-semibold text-white mb-1">MITRE ATT&CK Techniques</h2>
          <p className="text-gray-500 text-sm mb-3">
            Select specific techniques to focus on, or leave empty for AI to choose based on your theme.
          </p>
          {(mitreStats.mostUsed.length > 0 || mitreStats.leastUsed.length > 0) && (
            <div className="flex gap-4 mb-4">
              {mitreStats.mostUsed.length > 0 && <div><p className="text-gray-500 text-xs font-semibold mb-1">Most used in your portal:</p><div className="flex flex-wrap gap-1">{mitreStats.mostUsed.map(t => <span key={t} className="cyber-badge text-xs bg-yellow-500/10 text-yellow-400">{t}</span>)}</div></div>}
              {mitreStats.leastUsed.length > 0 && <div><p className="text-gray-500 text-xs font-semibold mb-1">Least covered — try these:</p><div className="flex flex-wrap gap-1">{mitreStats.leastUsed.map(t => <button key={t} onClick={() => setConfig(p => ({ ...p, mitreAttackIds: [...new Set([...p.mitreAttackIds, t])] }))} className="cyber-badge text-xs bg-green-500/10 text-green-400 hover:bg-green-500/20 cursor-pointer">{t} +</button>)}</div></div>}
            </div>
          )}

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {groupedTechniques.map((group) => (
              <div key={group.tactic}>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{group.tactic}</h3>
                <div className="flex flex-wrap gap-2">
                  {group.techniques.map((tech) => {
                    const selected = config.mitreAttackIds.includes(tech.id);
                    return (
                      <button
                        key={tech.id}
                        onClick={() => {
                          setConfig({
                            ...config,
                            mitreAttackIds: selected
                              ? config.mitreAttackIds.filter((id) => id !== tech.id)
                              : [...config.mitreAttackIds, tech.id],
                          });
                        }}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-mono transition-all border",
                          selected
                            ? "bg-cyber-600/20 border-cyber-600 text-cyber-400"
                            : "bg-surface-2 border-surface-3 text-gray-400 hover:border-surface-4"
                        )}
                      >
                        {tech.id} {tech.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {config.mitreAttackIds.length > 0 && (
            <p className="text-cyber-400 text-sm mt-4">
              {config.mitreAttackIds.length} technique{config.mitreAttackIds.length > 1 ? "s" : ""} selected
            </p>
          )}

          <div className="flex justify-between mt-8">
            <button onClick={() => setStep(4)} className="cyber-btn-secondary">← Back</button>
            <button onClick={() => setStep(6)} className="cyber-btn-primary">Next: Review & Launch →</button>
          </div>
        </div>
      )}

      {/* =============================== */}
      {/* STEP 5: Review & Launch           */}
      {/* =============================== */}
      {step === 6 && (
        <div>
          <h2 className="font-display text-lg font-semibold text-white mb-6">Review & Launch</h2>

          <div className="cyber-card space-y-4 mb-8">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500 text-xs uppercase">Theme</p>
                <p className="text-white mt-1">{selectedTheme?.icon} {selectedTheme?.name}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase">Difficulty</p>
                <p className="text-white mt-1">{config.difficulty}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase">Mode</p>
                <p className="text-white mt-1">{config.mode === "GROUP" ? "👥 Group (Real-time)" : "👤 Individual"}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase">Questions</p>
                <p className="text-white mt-1">{config.questionCount} questions</p>
              </div>
            </div>

            {/* Characters summary */}
            <div>
              <p className="text-gray-500 text-xs uppercase mb-2">Characters ({totalCharacters})</p>
              {totalCharacters === 0 ? (
                <p className="text-gray-400 text-sm">None selected — AI will use generic roles</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {rosterCharacters
                    .filter((c) => selectedCharacterIds.has(c.id))
                    .map((c) => (
                      <span key={c.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-3 rounded-lg text-xs">
                        <span className="text-white font-medium">{c.name}</span>
                        <span className="text-gray-500">·</span>
                        <span className="text-cyber-400">{c.role}</span>
                      </span>
                    ))}
                  {adHocCharacters.map((c) => (
                    <span key={c.tempId} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-xs">
                      <span className="text-white font-medium">{c.name}</span>
                      <span className="text-gray-500">·</span>
                      <span className="text-yellow-400">{c.role}</span>
                      <span className="text-yellow-500/60 text-[10px]">(one-off)</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* MITRE */}
            {config.mitreAttackIds.length > 0 && (
              <div>
                <p className="text-gray-500 text-xs uppercase mb-2">MITRE ATT&CK Techniques</p>
                <div className="flex flex-wrap gap-1">
                  {config.mitreAttackIds.map((id) => (
                    <span key={id} className="px-2 py-0.5 bg-surface-3 rounded text-xs font-mono text-cyber-400">{id}</span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-gray-500 text-xs uppercase mb-2">Security Stack ({orgTools.length} tools)</p>
              <p className="text-gray-400 text-sm">
                {orgTools.length === 0
                  ? "⚠️ No tools configured — scenarios will be generic."
                  : "Scenarios will reference your configured security tools."}
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{error}</div>
          )}

          <div className="flex justify-between">
            <button onClick={() => setStep(5)} className="cyber-btn-secondary">← Back</button>
            <button onClick={handleGenerate} disabled={generating} className="cyber-btn-primary px-8">
              {generating ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating Scenario...
                </span>
              ) : (
                "🚀 Generate & Launch"
              )}
            </button>
          </div>

          {generating && <div />}
        </div>
      )}
    </div>
  );
}
