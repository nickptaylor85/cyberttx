"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const CAMPAIGNS = [
  { month: "January", theme: "New Year Security Reset", exercises: [{ name: "Password Hygiene Audit", theme: "phishing", diff: "BEGINNER" }, { name: "Access Review Exercise", theme: "insider-threat", diff: "INTERMEDIATE" }] },
  { month: "February", theme: "Cloud Security Month", exercises: [{ name: "Cloud Misconfiguration Drill", theme: "cloud-breach", diff: "INTERMEDIATE" }, { name: "S3 Bucket Exposure", theme: "data-exfil", diff: "ADVANCED" }] },
  { month: "March", theme: "Ransomware Readiness", exercises: [{ name: "Ransomware Tabletop", theme: "ransomware", diff: "INTERMEDIATE" }, { name: "Backup Recovery Test", theme: "ransomware", diff: "ADVANCED" }] },
  { month: "April", theme: "Phishing Season (Tax)", exercises: [{ name: "Tax Season Phishing", theme: "phishing", diff: "BEGINNER" }, { name: "Executive Whaling", theme: "phishing", diff: "EXPERT" }] },
  { month: "May", theme: "Supply Chain Awareness", exercises: [{ name: "Vendor Risk Assessment", theme: "supply-chain", diff: "INTERMEDIATE" }, { name: "SolarWinds-Style Attack", theme: "supply-chain", diff: "ADVANCED" }] },
  { month: "June", theme: "Insider Threat Focus", exercises: [{ name: "Disgruntled Employee", theme: "insider-threat", diff: "INTERMEDIATE" }, { name: "Data Theft Detection", theme: "data-exfil", diff: "ADVANCED" }] },
  { month: "July", theme: "APT Simulation Month", exercises: [{ name: "Nation-State APT", theme: "apt", diff: "EXPERT" }, { name: "Multi-Stage Attack", theme: "apt", diff: "ADVANCED" }] },
  { month: "August", theme: "Incident Response", exercises: [{ name: "IR Tabletop Basic", theme: "ransomware", diff: "BEGINNER" }, { name: "Major Incident Management", theme: "ransomware", diff: "EXPERT" }] },
  { month: "September", theme: "Back to School Security", exercises: [{ name: "Security Awareness Refresher", theme: "phishing", diff: "BEGINNER" }, { name: "Credential Stuffing Response", theme: "phishing", diff: "INTERMEDIATE" }] },
  { month: "October", theme: "Cybersecurity Awareness Month", exercises: [{ name: "All-Hands Security Drill", theme: "ransomware", diff: "BEGINNER" }, { name: "Board-Level Crisis", theme: "ransomware", diff: "EXPERT" }, { name: "Cross-Department Exercise", theme: "insider-threat", diff: "INTERMEDIATE" }] },
  { month: "November", theme: "Black Friday / DDoS", exercises: [{ name: "DDoS Response Drill", theme: "ddos", diff: "INTERMEDIATE" }, { name: "E-Commerce Under Attack", theme: "ddos", diff: "ADVANCED" }] },
  { month: "December", theme: "Year-End Review", exercises: [{ name: "Annual Security Assessment", theme: "ransomware", diff: "INTERMEDIATE" }, { name: "Holiday Phishing Defence", theme: "phishing", diff: "BEGINNER" }] },
];

export default function CampaignsPage() {
  const router = useRouter();
  const [generating, setGenerating] = useState("");
  const currentMonth = new Date().toLocaleString("en-GB", { month: "long" });

  async function launch(theme: string, diff: string, name: string) {
    setGenerating(name);
    try {
      const res = await fetch("/api/ttx/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme, difficulty: diff, mode: "INDIVIDUAL", questionCount: 10, customIncident: `Campaign exercise: ${name}` }),
      });
      const data = await res.json();
      if (res.ok && data.id) window.location.href = `/portal/ttx/${data.id}`;
      else { alert(data.error || "Failed"); setGenerating(""); }
    } catch { setGenerating(""); }
  }

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl sm:text-2xl font-bold text-white">Training Campaigns</h1><p className="text-gray-500 text-xs mt-1">Monthly themed exercises aligned with the security calendar</p></div>
      <div className="space-y-4">{CAMPAIGNS.map(c => (
        <div key={c.month} className={`cyber-card ${c.month === currentMonth ? "border-cyber-600/30" : ""}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h2 className="text-white text-sm font-semibold">{c.month}: {c.theme}</h2>
              {c.month === currentMonth && <span className="cyber-badge text-xs bg-cyber-600/20 text-cyber-400 animate-pulse">This Month</span>}
            </div>
            <span className="text-gray-600 text-xs">{c.exercises.length} exercises</span>
          </div>
          <div className="space-y-1.5">{c.exercises.map(e => (
            <div key={e.name} className="flex items-center justify-between py-1.5 border-t border-surface-3/30">
              <div><p className="text-gray-300 text-xs">{e.name}</p><span className="text-gray-600 text-xs">{e.theme} · {e.diff}</span></div>
              <button onClick={() => launch(e.theme, e.diff, e.name)} disabled={!!generating} className="cyber-btn-primary text-xs py-1 px-2.5 disabled:opacity-50">{generating === e.name ? "..." : "Launch"}</button>
            </div>
          ))}</div>
        </div>
      ))}</div>
    </div>
  );
}
