import { db } from "@/lib/db";
import { getPortalOrg } from "@/lib/auth-helpers";
import { MITRE_TACTICS, COMMON_MITRE_TECHNIQUES } from "@/types";
export const dynamic = "force-dynamic";

export default async function MitreCoveragePage() {
  const org = await getPortalOrg();
  if (!org) return <p className="text-red-400 p-8">Organization not found</p>;

  const sessions = await db.ttxSession.findMany({
    where: { orgId: org.id, status: "COMPLETED" },
    select: { mitreAttackIds: true },
  });

  const techCounts: Record<string, number> = {};
  sessions.forEach(s => ((s.mitreAttackIds as string[]) || []).forEach(t => { techCounts[t] = (techCounts[t] || 0) + 1; }));

  const totalTechniques = COMMON_MITRE_TECHNIQUES.length;
  const coveredTechniques = COMMON_MITRE_TECHNIQUES.filter(t => techCounts[t.id]).length;
  const coveragePercent = totalTechniques > 0 ? Math.round((coveredTechniques / totalTechniques) * 100) : 0;
  const maxCount = Math.max(...Object.values(techCounts), 1);

  const grouped = MITRE_TACTICS.map(tactic => ({
    tactic,
    techniques: COMMON_MITRE_TECHNIQUES.filter(t => t.tactic === tactic).map(t => ({
      ...t, count: techCounts[t.id] || 0,
    })),
  })).filter(g => g.techniques.length > 0);

  function heatColor(count: number): string {
    if (count === 0) return "bg-surface-3 text-gray-600";
    const intensity = count / maxCount;
    if (intensity >= 0.7) return "bg-green-500/30 text-green-400 border-green-500/30";
    if (intensity >= 0.3) return "bg-cyan-500/20 text-cyan-400 border-cyan-500/20";
    return "bg-yellow-500/15 text-yellow-400 border-yellow-500/20";
  }

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl sm:text-2xl font-bold text-white">MITRE ATT&CK Coverage</h1><p className="text-gray-500 text-xs mt-1">{coveredTechniques}/{totalTechniques} techniques covered · {sessions.length} exercises</p></div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-cyber-400">{coveragePercent}%</p><p className="text-gray-500 text-xs">Coverage</p></div>
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-green-400">{coveredTechniques}</p><p className="text-gray-500 text-xs">Covered</p></div>
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-red-400">{totalTechniques - coveredTechniques}</p><p className="text-gray-500 text-xs">Gaps</p></div>
      </div>

      {/* Coverage bar */}
      <div className="cyber-card mb-6">
        <div className="flex items-center justify-between mb-2"><span className="text-gray-400 text-xs">Overall MITRE Coverage</span><span className="text-cyber-400 text-xs font-mono">{coveragePercent}%</span></div>
        <div className="h-3 bg-surface-3 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-cyber-600 to-green-500 rounded-full transition-all" style={{ width: `${coveragePercent}%` }} /></div>
      </div>

      {/* Heatmap by tactic */}
      <div className="space-y-4">{grouped.map(g => (
        <div key={g.tactic} className="cyber-card">
          <h2 className="text-white text-sm font-semibold mb-3">{g.tactic}</h2>
          <div className="flex flex-wrap gap-1.5">{g.techniques.map(t => (
            <div key={t.id} className={`group relative px-2 py-1 rounded text-xs border cursor-default ${heatColor(t.count)} transition-all`}>
              <span className="font-mono">{t.id}</span>
              {t.count > 0 && <span className="ml-1 opacity-70">×{t.count}</span>}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-10 bg-surface-0 border border-surface-3 rounded-lg px-3 py-2 shadow-xl whitespace-nowrap pointer-events-none">
                <p className="text-white text-xs font-semibold">{t.id}: {t.name}</p>
                <p className="text-gray-500 text-xs">{t.count} exercise{t.count !== 1 ? "s" : ""} · {t.tactic}</p>
              </div>
            </div>
          ))}</div>
        </div>
      ))}</div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-surface-3" /> Not covered</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-500/15" /> Low</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-cyan-500/20" /> Medium</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500/30" /> High</span>
      </div>
    </div>
  );
}
