import { db } from "@/lib/db";
import { headers } from "next/headers";
export const dynamic = "force-dynamic";

const FRAMEWORKS = [
  { name: "ISO 27001", controls: ["A.16.1.1 - Responsibilities", "A.16.1.5 - Response to incidents", "A.7.2.2 - Awareness training"], color: "blue" },
  { name: "NIST CSF", controls: ["PR.AT-1 - Awareness training", "RS.RP-1 - Response plan", "DE.DP-1 - Detection processes"], color: "green" },
  { name: "SOC 2", controls: ["CC7.4 - Incident response", "CC9.1 - Risk mitigation", "CC1.4 - Security awareness"], color: "purple" },
  { name: "NIS2", controls: ["Art 21(2)(b) - Incident handling", "Art 21(2)(g) - Security training", "Art 21(2)(c) - Business continuity"], color: "orange" },
  { name: "DORA", controls: ["Art 11 - ICT response & recovery", "Art 25 - Testing of ICT tools", "Art 26 - Threat-led pen testing"], color: "red" },
];

export default async function CompliancePage() {
  const h = await headers(); const slug = h.get("x-org-slug") || "demo";
  const org = await db.organization.findUnique({ where: { slug } });
  if (!org) return <p className="text-red-400">Org not found</p>;
  const completed = await db.ttxSession.count({ where: { orgId: org.id, status: "COMPLETED" } });
  const thisQuarter = await db.ttxSession.count({ where: { orgId: org.id, status: "COMPLETED", completedAt: { gte: new Date(new Date().getFullYear(), Math.floor(new Date().getMonth() / 3) * 3, 1) } } });
  const cc = (n: string) => n === "blue" ? "border-blue-500/30 bg-blue-500/5" : n === "green" ? "border-green-500/30 bg-green-500/5" : n === "purple" ? "border-purple-500/30 bg-purple-500/5" : n === "orange" ? "border-orange-500/30 bg-orange-500/5" : "border-red-500/30 bg-red-500/5";
  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl sm:text-2xl font-bold text-white">Compliance Evidence</h1><p className="text-gray-500 text-xs sm:text-sm mt-1">Auto-mapped from your exercises</p></div>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-cyber-400">{completed}</p><p className="text-gray-500 text-xs">Total Exercises</p></div>
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-green-400">{thisQuarter}</p><p className="text-gray-500 text-xs">This Quarter</p></div>
      </div>
      <div className="space-y-4">{FRAMEWORKS.map(fw => (
        <div key={fw.name} className={`cyber-card border ${cc(fw.color)}`}>
          <div className="flex items-center justify-between mb-3"><h3 className="text-white text-sm font-semibold">{fw.name}</h3><span className={`text-xs ${completed > 0 ? "text-green-400" : "text-gray-500"}`}>{completed > 0 ? "✓ Evidence available" : "No evidence"}</span></div>
          <div className="space-y-1">{fw.controls.map(c => (
            <div key={c} className="flex items-center gap-2"><span className={`w-1.5 h-1.5 rounded-full ${completed > 0 ? "bg-green-400" : "bg-gray-600"}`} /><span className="text-gray-400 text-xs">{c}</span></div>
          ))}</div>
        </div>
      ))}</div>
    </div>
  );
}
