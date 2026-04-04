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

export default function NewTtxPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [tools, setTools] = useState<Tool[]>([]);
  const [orgTools, setOrgTools] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const [config, setConfig] = useState({
    theme: "",
    difficulty: "INTERMEDIATE" as string,
    mode: "GROUP" as string,
    questionCount: 12,
    mitreAttackIds: [] as string[],
    timeLimitSecs: null as number | null,
  });

  useEffect(() => {
    // Fetch org's security tools
    fetch("/api/portal/tools")
      .then((r) => r.json())
      .then((data) => {
        setTools(data.allTools || []);
        setOrgTools(data.selectedIds || []);
        setLoading(false);
      });
  }, []);

  async function handleGenerate() {
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/ttx/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...config,
          toolIds: orgTools,
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

  if (loading) {
    return <div className="text-center py-20 text-gray-500">Loading configuration...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="font-display text-2xl font-bold text-white mb-2">Create New Exercise</h1>
      <p className="text-gray-500 text-sm mb-8">Configure your tabletop exercise and let AI generate the scenario.</p>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 mb-10">
        {["Theme", "Configuration", "MITRE ATT&CK", "Launch"].map((label, i) => (
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
            {i < 3 && <div className={cn("flex-1 h-px", step > i + 1 ? "bg-cyber-600" : "bg-surface-3")} />}
          </div>
        ))}
      </div>

      {/* Step 1: Theme */}
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
            <button
              onClick={() => setStep(2)}
              disabled={!config.theme}
              className="cyber-btn-primary disabled:opacity-50"
            >
              Next: Configuration →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Configuration */}
      {step === 2 && (
        <div className="space-y-6">
          <h2 className="font-display text-lg font-semibold text-white mb-4">Exercise Configuration</h2>

          {/* Difficulty */}
          <div>
            <label className="cyber-label">Difficulty Level</label>
            <div className="grid grid-cols-4 gap-3">
              {[
                { value: "BEGINNER", label: "Beginner", desc: "0-2 yrs", color: "green" },
                { value: "INTERMEDIATE", label: "Intermediate", desc: "2-5 yrs", color: "yellow" },
                { value: "ADVANCED", label: "Advanced", desc: "5-10 yrs", color: "orange" },
                { value: "EXPERT", label: "Expert", desc: "10+ yrs", color: "red" },
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
              type="range"
              min={8}
              max={20}
              value={config.questionCount}
              onChange={(e) => setConfig({ ...config, questionCount: parseInt(e.target.value) })}
              className="w-full accent-cyber-500"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>8 (Quick)</span>
              <span>20 (Deep Dive)</span>
            </div>
          </div>

          <div className="flex justify-between mt-8">
            <button onClick={() => setStep(1)} className="cyber-btn-secondary">← Back</button>
            <button onClick={() => setStep(3)} className="cyber-btn-primary">Next: MITRE ATT&CK →</button>
          </div>
        </div>
      )}

      {/* Step 3: MITRE ATT&CK */}
      {step === 3 && (
        <div>
          <h2 className="font-display text-lg font-semibold text-white mb-1">MITRE ATT&CK Techniques</h2>
          <p className="text-gray-500 text-sm mb-6">
            Select specific techniques to focus on, or leave empty for AI to choose based on your theme.
          </p>

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
            <button onClick={() => setStep(2)} className="cyber-btn-secondary">← Back</button>
            <button onClick={() => setStep(4)} className="cyber-btn-primary">Next: Review & Launch →</button>
          </div>
        </div>
      )}

      {/* Step 4: Review & Launch */}
      {step === 4 && (
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
                  ? "⚠️ No tools configured — scenarios will be generic. Configure your stack in Security Stack settings."
                  : "Scenarios will reference your configured security tools."}
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{error}</div>
          )}

          <div className="flex justify-between">
            <button onClick={() => setStep(3)} className="cyber-btn-secondary">← Back</button>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="cyber-btn-primary px-8"
            >
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
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-cyber-500"></span>
                </div>
                <p className="text-cyber-400 font-medium text-sm">AI is generating your scenario...</p>
              </div>
              <p className="text-gray-500 text-sm">
                Creating a realistic {selectedTheme?.name?.toLowerCase()} incident narrative with {config.questionCount} questions
                tailored to your security stack. This usually takes 15-30 seconds.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
