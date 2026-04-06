"use client";
import { useState } from "react";

export default function ExportPage() {
  const [exporting, setExporting] = useState("");

  async function exportData(type: string) {
    setExporting(type);
    try {
      const res = await fetch(`/api/portal/export?type=${type}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = `${type}-export.csv`; a.click();
        URL.revokeObjectURL(url);
      }
    } catch {} finally { setExporting(""); }
  }

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl sm:text-2xl font-bold text-white">Export Data</h1><p className="text-gray-500 text-xs mt-1">Download your portal data as CSV</p></div>
      <div className="grid sm:grid-cols-2 gap-3">
        {[
          { type: "exercises", label: "Exercises", desc: "All completed exercises with scores and dates", icon: "🎯" },
          { type: "users", label: "Team Members", desc: "All users with roles and activity", icon: "👥" },
          { type: "playbooks", label: "Playbooks", desc: "Saved playbook summaries", icon: "📋" },
          { type: "certificates", label: "Certificates", desc: "All earned certificates with grades", icon: "🏆" },
        ].map(e => (
          <button key={e.type} onClick={() => exportData(e.type)} disabled={!!exporting} className="cyber-card text-left hover:border-cyber-600/30 transition-colors disabled:opacity-50">
            <span className="text-2xl">{e.icon}</span>
            <p className="text-white text-sm font-semibold mt-2">{e.label}</p>
            <p className="text-gray-500 text-xs mt-1">{e.desc}</p>
            {exporting === e.type && <p className="text-cyber-400 text-xs mt-2 animate-pulse">Exporting...</p>}
          </button>
        ))}
      </div>
    </div>
  );
}
