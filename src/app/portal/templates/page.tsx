"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const PRESET_TEMPLATES = [
  { name: "Ransomware Response", theme: "ransomware", difficulty: "INTERMEDIATE", questions: 12, desc: "Classic ransomware scenario — encryption, ransom demands, recovery decisions" },
  { name: "Phishing Campaign", theme: "phishing", difficulty: "BEGINNER", questions: 8, desc: "Spear phishing targeting executives with credential harvesting" },
  { name: "Insider Threat", theme: "insider-threat", difficulty: "ADVANCED", questions: 15, desc: "Malicious insider with privileged access exfiltrating sensitive data" },
  { name: "Supply Chain Attack", theme: "supply-chain", difficulty: "ADVANCED", questions: 12, desc: "SolarWinds-style supply chain compromise via trusted vendor" },
  { name: "Cloud Breach", theme: "cloud-breach", difficulty: "INTERMEDIATE", questions: 10, desc: "Misconfigured cloud storage leading to data exposure" },
  { name: "APT Campaign", theme: "apt", difficulty: "EXPERT", questions: 15, desc: "State-sponsored persistent threat with multi-stage attack chain" },
  { name: "DDoS Attack", theme: "ddos", difficulty: "BEGINNER", questions: 8, desc: "Volumetric and application-layer DDoS with extortion" },
  { name: "Data Exfiltration", theme: "data-exfil", difficulty: "INTERMEDIATE", questions: 12, desc: "Stealthy data exfiltration via DNS tunnelling and cloud storage" },
  { name: "Board-Level Crisis", theme: "ransomware", difficulty: "EXPERT", questions: 10, desc: "Executive decision-making during a major ransomware crisis" },
  { name: "Quick Fire Drill", theme: "phishing", difficulty: "BEGINNER", questions: 5, desc: "5-minute rapid assessment for team warm-ups" },
];

export default function TemplatesPage() {
  const router = useRouter();
  const [generating, setGenerating] = useState<string | null>(null);

  async function launch(t: typeof PRESET_TEMPLATES[0]) {
    setGenerating(t.name);
    try {
      const res = await fetch("/api/ttx/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: t.theme, difficulty: t.difficulty, mode: "INDIVIDUAL", questionCount: t.questions }),
      });
      const data = await res.json();
      if (res.ok && data.id) {
        window.location.href = `/portal/ttx/${data.id}`;
      } else {
        alert(data.error || "Failed to generate");
        setGenerating(null);
      }
    } catch { alert("Generation failed"); setGenerating(null); }
  }

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl sm:text-2xl font-bold text-white">Templates</h1><p className="text-gray-500 text-xs mt-1">One-click launch — generates and starts the exercise immediately</p></div>
      <div className="grid sm:grid-cols-2 gap-3">{PRESET_TEMPLATES.map(t => (
        <button key={t.name} onClick={() => launch(t)} disabled={!!generating} className="cyber-card text-left hover:border-cyber-600/30 transition-colors disabled:opacity-50">
          <p className="text-white text-sm font-semibold">{t.name}</p>
          <p className="text-gray-500 text-xs mt-1">{t.desc}</p>
          <div className="flex gap-2 mt-2">
            <span className="cyber-badge text-xs bg-surface-3 text-gray-400">{t.theme}</span>
            <span className="cyber-badge text-xs bg-surface-3 text-gray-400">{t.difficulty}</span>
            <span className="cyber-badge text-xs bg-surface-3 text-gray-400">{t.questions}Q</span>
          </div>
          {generating === t.name && <p className="text-cyber-400 text-xs mt-2 animate-pulse">Generating scenario...</p>}
        </button>
      ))}</div>
    </div>
  );
}
