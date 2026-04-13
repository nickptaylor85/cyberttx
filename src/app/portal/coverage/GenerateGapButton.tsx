"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function GenerateGapButton({ techniqueId, techniqueName, tactic }: { techniqueId: string; techniqueName: string; tactic: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function generate() {
    setLoading(true);
    const res = await fetch("/api/ttx/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        theme: mapTacticToTheme(tactic),
        difficulty: "INTERMEDIATE",
        mode: "INDIVIDUAL",
        questionCount: 10,
        mitreAttackIds: [techniqueId],
        customIncident: `Focus on MITRE ATT&CK technique ${techniqueId}: ${techniqueName}. This is a targeted gap-fill exercise.`,
      }),
    });
    const data = await res.json();
    if (res.ok && data.id) {
      router.push(`/portal/ttx/${data.id}`);
    } else {
      alert(data.error || "Failed to generate");
      setLoading(false);
    }
  }

  return (
    <button
      onClick={generate}
      disabled={loading}
      className="w-full mt-2 text-xs py-1.5 px-3 rounded bg-cyber-600/20 text-cyber-400 border border-cyber-600/30 hover:bg-cyber-600/30 transition-colors disabled:opacity-50"
    >
      {loading ? "Generating..." : `⚡ Train ${techniqueId}`}
    </button>
  );
}

function mapTacticToTheme(tactic: string): string {
  const map: Record<string, string> = {
    "Initial Access": "phishing",
    "Execution": "ransomware",
    "Persistence": "apt",
    "Privilege Escalation": "insider-threat",
    "Defense Evasion": "apt",
    "Credential Access": "phishing",
    "Discovery": "apt",
    "Lateral Movement": "ransomware",
    "Collection": "data-exfil",
    "Command and Control": "apt",
    "Exfiltration": "data-exfil",
    "Impact": "ransomware",
  };
  return map[tactic] || "ransomware";
}
