import { db } from "@/lib/db";
import { headers } from "next/headers";
export const dynamic = "force-dynamic";

const TACTICS = [
  { id: "TA0001", name: "Initial Access", techniques: ["T1566","T1190","T1195","T1199","T1078"] },
  { id: "TA0002", name: "Execution", techniques: ["T1059","T1204","T1053","T1569"] },
  { id: "TA0003", name: "Persistence", techniques: ["T1547","T1136","T1053","T1098"] },
  { id: "TA0004", name: "Privilege Escalation", techniques: ["T1548","T1134","T1078"] },
  { id: "TA0005", name: "Defense Evasion", techniques: ["T1070","T1036","T1027","T1562"] },
  { id: "TA0006", name: "Credential Access", techniques: ["T1110","T1003","T1555","T1552"] },
  { id: "TA0007", name: "Discovery", techniques: ["T1087","T1046","T1082","T1083"] },
  { id: "TA0008", name: "Lateral Movement", techniques: ["T1021","T1570","T1080"] },
  { id: "TA0009", name: "Collection", techniques: ["T1005","T1039","T1114","T1119"] },
  { id: "TA0010", name: "Exfiltration", techniques: ["T1567","T1048","T1041"] },
  { id: "TA0011", name: "Command & Control", techniques: ["T1071","T1105","T1572"] },
  { id: "TA0040", name: "Impact", techniques: ["T1486","T1490","T1489","T1529"] },
];

export default async function CoveragePage() {
  const h = await headers(); const slug = h.get("x-org-slug") || "demo";
  const org = await db.organization.findUnique({ where: { slug } });
  if (!org) return <p className="text-red-400">Organization not found</p>;
  const sessions = await db.ttxSession.findMany({ where: { orgId: org.id, status: "COMPLETED" }, select: { mitreAttackIds: true } });
  const tested = new Set(sessions.flatMap(s => (s.mitreAttackIds as string[]) || []));
  const totalTech = TACTICS.reduce((s, t) => s + t.techniques.length, 0);
  const coveredTech = TACTICS.reduce((s, t) => s + t.techniques.filter(te => tested.has(te)).length, 0);
  const pct = totalTech > 0 ? Math.round((coveredTech / totalTech) * 100) : 0;
  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl sm:text-2xl font-bold text-white">MITRE ATT&CK Coverage</h1><p className="text-gray-500 text-xs sm:text-sm mt-1">{coveredTech}/{totalTech} techniques tested ({pct}%)</p></div>
      <div className="h-2 bg-surface-3 rounded-full mb-6 overflow-hidden"><div className="h-full bg-cyber-500 rounded-full transition-all" style={{ width: `${pct}%` }} /></div>
      <div className="space-y-4">{TACTICS.map(tactic => {
        const covered = tactic.techniques.filter(t => tested.has(t)).length;
        return (
          <div key={tactic.id} className="cyber-card">
            <div className="flex items-center justify-between mb-2"><h3 className="text-white text-sm font-medium">{tactic.name}</h3><span className="text-gray-500 text-xs">{covered}/{tactic.techniques.length}</span></div>
            <div className="flex flex-wrap gap-1">{tactic.techniques.map(t => (
              <span key={t} className={`px-2 py-0.5 rounded text-xs font-mono ${tested.has(t) ? "bg-cyber-600/20 text-cyber-400" : "bg-surface-2 text-gray-600"}`}>{t}</span>
            ))}</div>
          </div>
        );
      })}</div>
    </div>
  );
}
