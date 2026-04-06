"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CustomScenarioPage() {
  const router = useRouter();
  const [incident, setIncident] = useState("");
  const [difficulty, setDifficulty] = useState("INTERMEDIATE");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate() {
    if (!incident.trim()) return;
    setGenerating(true); setError("");
    try {
      const res = await fetch("/api/ttx/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme: "custom",
          difficulty,
          mode: "INDIVIDUAL",
          questionCount: 12,
          mitreAttackIds: [],
          customIncident: incident,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      const session = await res.json();
      router.push(`/portal/ttx/${session.id}`);
    } catch (e: any) {
      setError(e.message || "Failed to generate");
      setGenerating(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-xl sm:text-2xl font-bold text-white">Custom Exercise Builder</h1>
        <p className="text-gray-500 text-xs sm:text-sm mt-1">Paste a real incident report, post-mortem, or threat brief — AI converts it into a tabletop exercise</p>
      </div>

      <div className="cyber-card mb-4">
        <label className="cyber-label">Incident Description</label>
        <textarea
          className="cyber-input w-full h-48 resize-none font-mono text-xs"
          placeholder={"Paste your incident report, post-mortem, or threat intelligence brief here...\n\nExample:\n\"On March 15, our SOC detected unusual PowerShell activity on 3 finance endpoints. Investigation revealed a phishing email with a macro-enabled Excel attachment had been opened by an analyst in the accounts team. The macro executed an encoded PowerShell payload that downloaded a second-stage binary from a recently-registered domain. Within 2 hours, lateral movement was detected via RDP to 2 additional servers...\""}
          value={incident}
          onChange={e => setIncident(e.target.value)}
        />
        <p className="text-gray-600 text-xs mt-2">Minimum 50 characters. The more detail you provide, the more realistic the exercise.</p>
      </div>

      <div className="cyber-card mb-4">
        <label className="cyber-label">Difficulty</label>
        <div className="grid grid-cols-4 gap-2">
          {["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"].map(d => (
            <button key={d} onClick={() => setDifficulty(d)}
              className={`p-2 rounded-lg text-xs text-center border transition-colors ${difficulty === d ? "bg-cyber-600/15 border-cyber-500 text-cyber-400" : "bg-surface-0 border-surface-3 text-gray-400 hover:border-surface-4"}`}>
              {d}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm mb-4">{error}</div>}

      <button onClick={handleGenerate} disabled={generating || incident.trim().length < 50}
        className="cyber-btn-primary w-full py-3 disabled:opacity-50">
        {generating ? "Generating..." : "Generate Exercise from Incident →"}
      </button>

      <p className="text-gray-600 text-xs text-center mt-3">AI will extract threat actors, techniques, and decision points from your incident description</p>
    </div>
  );
}
