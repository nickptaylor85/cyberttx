"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CustomScenarioPage() {
  const router = useRouter();
  const [incident, setIncident] = useState("");
  const [difficulty, setDifficulty] = useState("INTERMEDIATE");
  const [theme, setTheme] = useState("custom");
  const [questionCount, setQuestionCount] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate() {
    if (!incident.trim()) { setError("Please describe an incident scenario"); return; }
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/ttx/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme, difficulty, questionCount,
          customIncident: incident,
          mode: "INDIVIDUAL",
          language: document.cookie.match(/lang=(\w+)/)?.[1] || "en",
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Generation failed");
      }
      const session = await res.json();
      router.push("/portal/ttx/" + session.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate");
      setGenerating(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display text-xl sm:text-2xl font-bold text-white mb-2">Custom Exercise</h1>
      <p className="text-gray-500 text-sm mb-6">Describe a real or hypothetical incident and the AI will build a full tabletop exercise from it.</p>

      <div className="space-y-4">
        <div>
          <label className="cyber-label">Incident Description</label>
          <textarea className="cyber-input w-full min-h-[120px]" placeholder="e.g. A finance team member received a convincing email from what appeared to be the CEO requesting an urgent wire transfer of £250,000 to a new supplier. The email came from a lookalike domain..." value={incident} onChange={e => setIncident(e.target.value)} />
          <p className="text-gray-600 text-xs mt-1">{incident.length}/2000 characters</p>
        </div>

        <div>
          <label className="cyber-label">Theme</label>
          <select className="cyber-input w-full" value={theme} onChange={e => setTheme(e.target.value)}>
            <option value="custom">Custom (from description)</option>
            <option value="ransomware">Ransomware</option>
            <option value="phishing">Phishing / BEC</option>
            <option value="apt">APT / Nation-State</option>
            <option value="insider-threat">Insider Threat</option>
            <option value="supply-chain">Supply Chain</option>
            <option value="cloud-breach">Cloud Breach</option>
            <option value="data-exfiltration">Data Exfiltration</option>
          </select>
        </div>

        <div>
          <label className="cyber-label">Difficulty</label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { value: "BEGINNER", label: "Beginner" },
              { value: "INTERMEDIATE", label: "Intermediate" },
              { value: "ADVANCED", label: "Advanced" },
              { value: "EXPERT", label: "Expert" },
            ].map(d => (
              <button key={d.value} onClick={() => setDifficulty(d.value)}
                className={"p-2 rounded-lg border text-xs font-medium transition-all " + (difficulty === d.value ? "border-[#00ffd5]/50 bg-[#00ffd5]/10 text-[#00ffd5]" : "border-surface-3 bg-surface-2 text-gray-400 hover:border-surface-4")}>
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="cyber-label">Questions: {questionCount}</label>
          <input type="range" min={6} max={12} value={questionCount} onChange={e => setQuestionCount(parseInt(e.target.value))} className="w-full accent-[#00ffd5]" />
          <div className="flex justify-between text-xs text-gray-600"><span>6 (Quick)</span><span>12 (Deep)</span></div>
        </div>

        {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{error}</div>}

        <button onClick={handleGenerate} disabled={generating || !incident.trim()} className="cyber-btn-primary w-full py-3 disabled:opacity-50">
          {generating ? "Generating..." : "Generate Custom Exercise"}
        </button>
      </div>
    </div>
  );
}
