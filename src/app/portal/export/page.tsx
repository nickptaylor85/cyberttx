"use client";
import { useState } from "react";

export default function ClientExportPage() {
  const [exporting, setExporting] = useState("");

  async function exportData(type: string) {
    setExporting(type);
    try {
      const res = await fetch(`/api/portal/export?type=${type}`);
      if (!res.ok) throw new Error("Failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `threatcast-${type}-${new Date().toISOString().split("T")[0]}.csv`; a.click();
      URL.revokeObjectURL(url);
    } catch { alert("Export failed"); }
    setExporting("");
  }

  const exports = [
    { type: "exercises", label: "Exercise History", desc: "All exercises with scores, themes, dates, participants", icon: "🎯" },
    { type: "team", label: "Team Performance", desc: "Individual accuracy, exercise count, roles", icon: "👥" },
    { type: "compliance", label: "Compliance Evidence", desc: "Exercise evidence mapped to ISO, NIST, SOC 2, NIS2, DORA", icon: "📋" },
    { type: "all", label: "Full Data Export", desc: "Complete organisation data (GDPR data portability)", icon: "📦" },
  ];

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl sm:text-2xl font-bold text-white">Export Data</h1><p className="text-gray-500 text-xs sm:text-sm mt-1">Download your data for reporting or compliance</p></div>
      <div className="grid sm:grid-cols-2 gap-3">{exports.map(e => (
        <div key={e.type} className="cyber-card">
          <div className="flex items-start gap-3">
            <span className="text-2xl">{e.icon}</span>
            <div className="flex-1"><h3 className="text-white text-sm font-semibold">{e.label}</h3><p className="text-gray-500 text-xs mt-1">{e.desc}</p>
              <button onClick={() => exportData(e.type)} disabled={exporting === e.type} className="cyber-btn-secondary text-xs mt-3 disabled:opacity-50">{exporting === e.type ? "Exporting..." : "Download CSV"}</button>
            </div>
          </div>
        </div>
      ))}</div>
    </div>
  );
}
