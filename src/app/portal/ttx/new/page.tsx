"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TTX_THEMES, COMMON_MITRE_TECHNIQUES, MITRE_TACTICS } from "@/types";
import { cn } from "@/lib/utils";

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

const WIZARD_STEPS = ["Theme", "Configuration", "Characters", "MITRE ATT&CK", "Launch"];

export default function NewTtxPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [tools, setTools] = useState<Tool[]>([]);
  const [orgTools, setOrgTools] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [mitreStats, setMitreStats] = useState<{ mostUsed: string[]; leastUsed: string[] }>({ mostUsed: [], leastUsed: [] });
  const [error, setError] = useState("");

  // Characters from roster
  const [rosterCharacters, setRosterCharacters] = useState<Character[]>([]);
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<Set<string>>(new Set());

  // One-off characters for this session only
  const [adHocCharacters, setAdHocCharacters] = useState<AdHocCharacter[]>([]);
  const [showAdHocForm, setShowAdHocForm] = useState(false);
  const [adHocForm, setAdHocForm] = useState({ name: "", role: "", department: "", description: "" });

  const [config, setConfig] = useState({
    theme: "",
    difficulty: "INTERMEDIATE" as string,
    mode: "GROUP" as string,
    questionCount: 12,
    mitreAttackIds: [] as string[],
    timeLimitSecs: null as number | null,
  });

  // Handle ?fromAlert= param from Alert Feed
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const alertData = params.get("fromAlert");
    if (alertData) {
      try {
        const alert = JSON.parse(decodeURIComponent(alertData));
        // Pre-fill the custom incident field with alert details
        const incident = `REAL ALERT FROM ${alert.source || "Security Tool"}:\n` +
          `Title: ${alert.title}\n` +
          `Severity: ${alert.severity}\n` +
          `Description: ${alert.description}\n` +
          (alert.assets?.length ? `Affected Assets: ${alert.assets.join(", ")}\n` : "") +
          (alert.mitre?.length ? `MITRE Techniques: ${alert.mitre.join(", ")}\n` : "");
        setConfig(p => ({
          ...p,
          mitreAttackIds: [...new Set([...p.mitreAttackIds, ...(alert.mitre || [])])],
        }));
        // Store for the custom incident field
        (window as any).__alertIncident = incident;
      } catch {}
    }
  }, []);

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

    // Build selected characters payload
    const selectedRoster = rosterCharacters
      .filter((c) => selectedCharacterIds.has(c.id))
      .map((c) => ({
        name: c.name,
        role: c.role,
        department: c.department || "",
        description: c.description || "",
        expertise: c.expertise || [],
      }));

    const adHocPayload = adHocCharacters.map((c) => ({
      name: c.name,
      role: c.role,
      department: c.department || "",
      description: c.description || "",
      expertise: [],
    }));

    try {
      const res = await fetch("/api/ttx/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...config,
          toolIds: orgTools,
          selectedCharacters: [...selectedRoster, ...adHocPayload],
          language: document.cookie.match(/lang=(\w+)/)?.[1] || "en",
          customIncident: (window as any).__alertIncident || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Generation failed");
      }
      const session = await res.json();
      router.push(`/portal/ttx/${session.id}`);
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
              Next: Configuration →
            </button>
          </div>
        </div>
      )}

      {/* =============================== */}
      {/* STEP 2: Configuration            */}
      {/* =============================== */}
      {step === 2 && (
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
              type="range" min={8} max={20} value={config.questionCount}
              onChange={(e) => setConfig({ ...config, questionCount: parseInt(e.target.value) })}
              className="w-full accent-cyber-500"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>8 (Quick)</span><span>20 (Deep Dive)</span>
            </div>
          </div>

          <div className="flex justify-between mt-8">
            <button onClick={() => setStep(1)} className="cyber-btn-secondary">← Back</button>
            <button onClick={() => setStep(3)} className="cyber-btn-primary">Next: Characters →</button>
          </div>
        </div>
      )}

      {/* =============================== */}
      {/* STEP 3: Characters               */}
      {/* =============================== */}
      {step === 3 && (
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
            <button onClick={() => setStep(2)} className="cyber-btn-secondary">← Back</button>
            <button onClick={() => setStep(4)} className="cyber-btn-primary">Next: MITRE ATT&CK →</button>
          </div>
        </div>
      )}

      {/* =============================== */}
      {/* STEP 4: MITRE ATT&CK             */}
      {/* =============================== */}
      {step === 4 && (
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
            <button onClick={() => setStep(3)} className="cyber-btn-secondary">← Back</button>
            <button onClick={() => setStep(5)} className="cyber-btn-primary">Next: Review & Launch →</button>
          </div>
        </div>
      )}

      {/* =============================== */}
      {/* STEP 5: Review & Launch           */}
      {/* =============================== */}
      {step === 5 && (
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
            <button onClick={() => setStep(4)} className="cyber-btn-secondary">← Back</button>
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

          {generating && (
            <div className="mt-6 cyber-card bg-surface-0 border-cyber-600/30">
              <div className="flex items-center gap-3 mb-3">
                <div className="relative flex h-3 w-3">
                  <span className="animate-ping absolute h-full w-full rounded-full bg-cyber-400 opacity-75"></span>
                  <span className="relative rounded-full h-3 w-3 bg-cyber-500"></span>
                </div>
                <p className="text-cyber-400 font-medium text-sm">AI is generating your scenario...</p>
              </div>
              <p className="text-gray-500 text-sm">
                Creating a realistic {selectedTheme?.name?.toLowerCase()} incident with {config.questionCount} questions
                {totalCharacters > 0 ? `, featuring ${totalCharacters} named character${totalCharacters > 1 ? "s" : ""}` : ""}
                . This usually takes 15-30 seconds.
              </p>
              <p className="text-gray-500 text-xs mt-3">You can navigate away — we&apos;ll email you when it&apos;s ready.</p>
              <a href="/portal/ttx" className="text-cyber-400 text-sm hover:text-cyber-300 mt-2 inline-block">← Back to exercises</a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
