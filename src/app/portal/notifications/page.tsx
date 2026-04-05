"use client";
import { useState } from "react";

export default function NotificationsPage() {
  const [prefs, setPrefs] = useState({
    exerciseComplete: true, weeklyDigest: true, lowAccuracy: true,
    newThreatIntel: false, teamJoined: true, complianceGap: true,
  });
  const [saved, setSaved] = useState(false);

  const toggle = (key: string) => setPrefs(p => ({ ...p, [key]: !(p as any)[key] }));
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 3000); };

  const options = [
    { key: "exerciseComplete", label: "Exercise completed", desc: "When any team member completes a TTX" },
    { key: "weeklyDigest", label: "Weekly digest", desc: "Summary of exercises, scores, and compliance status" },
    { key: "lowAccuracy", label: "Low accuracy alert", desc: "When team accuracy drops below 60%" },
    { key: "newThreatIntel", label: "New threat intelligence", desc: "When new threats matching your sector are detected" },
    { key: "teamJoined", label: "Team member joined", desc: "When someone accepts an invitation" },
    { key: "complianceGap", label: "Compliance gap", desc: "When you're behind on framework exercise requirements" },
  ];

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl sm:text-2xl font-bold text-white">Notification Preferences</h1><p className="text-gray-500 text-xs sm:text-sm mt-1">Control which emails and alerts you receive</p></div>
      <div className="cyber-card mb-4">
        <div className="space-y-3">{options.map(o => (
          <div key={o.key} className="flex items-center justify-between py-2 border-b border-surface-3/50 last:border-0">
            <div><p className="text-white text-sm">{o.label}</p><p className="text-gray-500 text-xs">{o.desc}</p></div>
            <button onClick={() => toggle(o.key)} className={`w-11 h-6 rounded-full transition-colors relative ${(prefs as any)[o.key] ? "bg-cyber-500" : "bg-surface-3"}`}>
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${(prefs as any)[o.key] ? "translate-x-5.5 left-0.5" : "left-0.5"}`} style={{ left: (prefs as any)[o.key] ? "22px" : "2px" }} />
            </button>
          </div>
        ))}</div>
      </div>
      <button onClick={save} className="cyber-btn-primary text-sm">{saved ? "Saved!" : "Save Preferences"}</button>
    </div>
  );
}
