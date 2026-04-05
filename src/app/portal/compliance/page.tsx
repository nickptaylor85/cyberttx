import { db } from "@/lib/db";
import { headers } from "next/headers";
export const dynamic = "force-dynamic";

const FRAMEWORKS = [
  { name: "ISO 27001", controls: ["A.16.1.1 — Responsibilities & procedures", "A.16.1.5 — Response to incidents", "A.7.2.2 — Awareness & training"], color: "blue", cadence: "Annual surveillance audit" },
  { name: "NIST CSF", controls: ["PR.AT-1 — Awareness & training", "RS.RP-1 — Response plan execution", "DE.DP-1 — Detection processes"], color: "green", cadence: "Continuous monitoring" },
  { name: "SOC 2", controls: ["CC7.4 — Incident response", "CC9.1 — Risk mitigation", "CC1.4 — Security awareness"], color: "purple", cadence: "Annual audit" },
  { name: "NIS2", controls: ["Art 21(2)(b) — Incident handling", "Art 21(2)(g) — Security training", "Art 21(2)(c) — Business continuity"], color: "orange", cadence: "Quarterly reporting" },
  { name: "DORA", controls: ["Art 11 — ICT response & recovery", "Art 25 — Testing of ICT tools", "Art 26 — Threat-led pen testing"], color: "red", cadence: "Annual testing programme" },
];

export default async function CompliancePage() {
  const h = await headers(); const slug = h.get("x-org-slug") || "demo";
  const org = await db.organization.findUnique({ where: { slug } });
  if (!org) return <p className="text-red-400">Org not found</p>;
  const completed = await db.ttxSession.count({ where: { orgId: org.id, status: "COMPLETED" } });
  const now = new Date();
  const qStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  const thisQuarter = await db.ttxSession.count({ where: { orgId: org.id, status: "COMPLETED", completedAt: { gte: qStart } } });
  const lastExercise = await db.ttxSession.findFirst({ where: { orgId: org.id, status: "COMPLETED" }, orderBy: { completedAt: "desc" }, select: { completedAt: true } });
  const daysSinceLast = lastExercise?.completedAt ? Math.floor((now.getTime() - lastExercise.completedAt.getTime()) / 86400000) : null;

  // Regulatory calendar — upcoming deadlines
  const calendar = [
    { framework: "NIS2", deadline: "End of Q2 2026", desc: "Quarterly incident preparedness report due", urgent: true },
    { framework: "DORA", deadline: "Jan 2027", desc: "Annual ICT testing programme evidence required", urgent: false },
    { framework: "ISO 27001", deadline: "Next surveillance audit", desc: "A.16.1 evidence must include recent TTX", urgent: daysSinceLast ? daysSinceLast > 60 : true },
    { framework: "SOC 2", deadline: "Continuous", desc: "CC7.4 evidence reviewed during audit window", urgent: thisQuarter === 0 },
  ];

  const cc = (n: string) => n === "blue" ? "border-blue-500/30 bg-blue-500/5" : n === "green" ? "border-green-500/30 bg-green-500/5" : n === "purple" ? "border-purple-500/30 bg-purple-500/5" : n === "orange" ? "border-orange-500/30 bg-orange-500/5" : "border-red-500/30 bg-red-500/5";

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl sm:text-2xl font-bold text-white">Compliance Evidence</h1><p className="text-gray-500 text-xs sm:text-sm mt-1">Auto-mapped from your exercises · {completed} total, {thisQuarter} this quarter</p></div>

      {/* Urgency alerts */}
      {calendar.filter(c => c.urgent).length > 0 && (
        <div className="cyber-card border-orange-500/30 bg-orange-500/5 mb-6">
          <h2 className="font-display text-sm font-semibold text-orange-400 mb-3">⚠️ Action Required</h2>
          <div className="space-y-2">{calendar.filter(c => c.urgent).map(c => (
            <div key={c.framework} className="flex items-start gap-2">
              <span className="text-orange-400 text-xs mt-0.5">●</span>
              <div><p className="text-white text-sm"><span className="font-medium">{c.framework}</span> — {c.deadline}</p><p className="text-gray-400 text-xs">{c.desc}</p></div>
            </div>
          ))}</div>
          {thisQuarter === 0 && <a href="/portal/ttx/new" className="cyber-btn-primary text-xs mt-3 inline-block">Run Exercise Now →</a>}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-cyber-400">{completed}</p><p className="text-gray-500 text-xs">Total Evidence</p></div>
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-green-400">{thisQuarter}</p><p className="text-gray-500 text-xs">This Quarter</p></div>
        <div className="cyber-card text-center"><p className={`font-display text-2xl font-bold ${daysSinceLast !== null && daysSinceLast <= 30 ? "text-green-400" : daysSinceLast !== null && daysSinceLast <= 60 ? "text-yellow-400" : "text-red-400"}`}>{daysSinceLast !== null ? `${daysSinceLast}d` : "—"}</p><p className="text-gray-500 text-xs">Since Last TTX</p></div>
      </div>

      {/* Framework cards */}
      <div className="space-y-4">{FRAMEWORKS.map(fw => (
        <div key={fw.name} className={`cyber-card border ${cc(fw.color)}`}>
          <div className="flex items-center justify-between mb-3">
            <div><h3 className="text-white text-sm font-semibold">{fw.name}</h3><p className="text-gray-500 text-xs">{fw.cadence}</p></div>
            <span className={`text-xs font-medium ${completed > 0 ? "text-green-400" : "text-red-400"}`}>{completed > 0 ? `✓ ${completed} evidenced` : "✗ No evidence"}</span>
          </div>
          <div className="space-y-1">{fw.controls.map(c => (
            <div key={c} className="flex items-center gap-2"><span className={`w-1.5 h-1.5 rounded-full ${completed > 0 ? "bg-green-400" : "bg-gray-600"}`} /><span className="text-gray-400 text-xs">{c}</span></div>
          ))}</div>
        </div>
      ))}</div>
    </div>
  );
}
