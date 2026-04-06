"use client";
import { useState, useTransition } from "react";
import { exportClients, exportUsers, exportSessions } from "../actions";

export default function ExportPage() {
  const [isPending, startTransition] = useTransition();
  const [active, setActive] = useState("");

  function download(type: string, fn: () => Promise<string>) {
    setActive(type);
    startTransition(async () => {
      const csv = await fn();
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `threatcast-${type}-${new Date().toISOString().split("T")[0]}.csv`; a.click();
      URL.revokeObjectURL(url);
      setActive("");
    });
  }

  const exports = [
    { type: "clients", label: "Client Portals", desc: "Name, slug, plan, users, sessions, created date", icon: "🏢", fn: exportClients },
    { type: "users", label: "All Users", desc: "Name, email, role, org, exercise count, signup date", icon: "👥", fn: exportUsers },
    { type: "sessions", label: "All Sessions", desc: "Title, theme, status, org, participants, dates", icon: "🎯", fn: exportSessions },
  ];

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl sm:text-2xl font-bold text-white">Export Data</h1><p className="text-gray-500 text-xs mt-1">Download CSV exports for reporting</p></div>
      <div className="grid sm:grid-cols-3 gap-4">{exports.map(e => (
        <div key={e.type} className="cyber-card">
          <span className="text-2xl">{e.icon}</span>
          <h3 className="text-white text-sm font-semibold mt-2">{e.label}</h3>
          <p className="text-gray-500 text-xs mt-1">{e.desc}</p>
          <button onClick={() => download(e.type, e.fn)} disabled={isPending} className="cyber-btn-primary text-xs mt-3 disabled:opacity-50">{active === e.type ? "Exporting..." : "Download CSV"}</button>
        </div>
      ))}</div>
    </div>
  );
}
