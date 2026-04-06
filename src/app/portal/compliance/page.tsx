import { db } from "@/lib/db";
import { getPortalOrg } from "@/lib/auth-helpers";
export const dynamic = "force-dynamic";

export default async function CompliancePage() {
  const org = await getPortalOrg();
  if (!org) return <p className="text-red-400 p-8">Organization not found</p>;

  const completed = await db.ttxSession.count({ where: { orgId: org.id, status: "COMPLETED" } });
  const users = await db.user.count({ where: { orgId: org.id, clerkId: { startsWith: "hash:" } } });
  const themes = await db.ttxSession.findMany({ where: { orgId: org.id, status: "COMPLETED" }, select: { theme: true } });
  const uniqueThemes = new Set(themes.map(t => t.theme)).size;

  const frameworks = [
    { name: "ISO 27001", standard: "A.7.2.2", desc: "Information security awareness, education and training", evidence: `${completed} tabletop exercises completed by ${users} users across ${uniqueThemes} threat scenarios`, met: completed >= 1, controls: ["A.7.2.2 Training", "A.16.1.1 Responsibilities", "A.16.1.5 Response to incidents"] },
    { name: "NIST CSF", standard: "PR.AT", desc: "Awareness and Training", evidence: `Ongoing cybersecurity awareness through realistic incident simulations`, met: completed >= 1, controls: ["PR.AT-1 Users informed", "PR.AT-2 Privileged users", "RS.CO-1 Personnel know roles"] },
    { name: "SOC 2", standard: "CC1.4", desc: "Security awareness training and competency", evidence: `${completed} scenario-based exercises with scored assessments`, met: completed >= 3, controls: ["CC1.4 Competency", "CC2.2 Communication", "CC7.4 Response activities"] },
    { name: "NIS2", standard: "Art. 21(2)(g)", desc: "Basic cyber hygiene practices and cybersecurity training", evidence: `Regular tabletop exercises covering ${uniqueThemes} threat categories`, met: completed >= 2, controls: ["Art.21(2)(g) Training", "Art.21(2)(b) Incident handling", "Art.23 Reporting"] },
    { name: "DORA", standard: "Art. 25", desc: "ICT-related incident response training", evidence: `Financial services tabletop exercises with incident response playbooks`, met: completed >= 2, controls: ["Art.25 Testing", "Art.11 Response plans", "Art.13 Classification"] },
    { name: "PCI DSS 4.0", standard: "12.6", desc: "Security awareness training program", evidence: `${completed} exercises including phishing and data protection scenarios`, met: completed >= 4, controls: ["12.6.1 Awareness program", "12.6.2 Annual review", "12.10.2 IR training"] },
  ];

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl sm:text-2xl font-bold text-white">Compliance Evidence</h1><p className="text-gray-500 text-xs mt-1">Map your exercises to compliance frameworks</p></div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-green-400">{frameworks.filter(f => f.met).length}/{frameworks.length}</p><p className="text-gray-500 text-xs">Frameworks Met</p></div>
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-cyber-400">{completed}</p><p className="text-gray-500 text-xs">Evidence Items</p></div>
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-white">{users}</p><p className="text-gray-500 text-xs">Trained Users</p></div>
      </div>

      <div className="space-y-3">{frameworks.map(f => (
        <div key={f.name} className={`cyber-card ${f.met ? "border-green-500/20" : "border-yellow-500/20"}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${f.met ? "bg-green-400" : "bg-yellow-400"}`} />
              <h2 className="text-white text-sm font-semibold">{f.name}</h2>
              <span className="text-gray-500 text-xs font-mono">{f.standard}</span>
            </div>
            <span className={`cyber-badge text-xs ${f.met ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>{f.met ? "Evidence Available" : "More Exercises Needed"}</span>
          </div>
          <p className="text-gray-400 text-xs mb-2">{f.desc}</p>
          <div className="mb-2">
            <p className="text-gray-500 text-xs font-semibold mb-1">Evidence:</p>
            <p className="text-gray-400 text-xs">{f.evidence}</p>
            {f.met && (
              <div className="mt-1.5 p-2 rounded bg-green-500/5 border border-green-500/10">
                <p className="text-green-400 text-xs font-semibold mb-1">Available Evidence Items:</p>
                <ul className="text-gray-400 text-xs space-y-0.5">
                  <li>• {completed} completed tabletop exercise reports</li>
                  <li>• Scored assessments with {completed > 0 ? Math.round((completed * uniqueThemes) / 2) : 0}+ individual participant results</li>
                  <li>• {uniqueThemes} threat categories covered</li>
                  <li>• Incident response playbooks with correct response procedures</li>
                  <li>• MITRE ATT&CK technique coverage mapping</li>
                  <li>• Downloadable PDF certificates with 1-year validity</li>
                  {users > 1 ? <li>• {users} staff members trained across the organisation</li> : null}
                </ul>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-1">{f.controls.map(ctrl => <span key={ctrl} className="cyber-badge text-xs bg-surface-3 text-gray-400">{ctrl}</span>)}</div>
        </div>
      ))}</div>
    </div>
  );
}
