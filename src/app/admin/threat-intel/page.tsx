import { db } from "@/lib/db";
export const dynamic = "force-dynamic";

export default async function ThreatIntelPage() {
  // Gather intelligence from all exercises
  const sessions = await db.ttxSession.findMany({
    where: { status: "COMPLETED" },
    select: { theme: true, mitreAttackIds: true, scenario: true, difficulty: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // Theme distribution
  const themeCount: Record<string, number> = {};
  sessions.forEach(s => { themeCount[s.theme || "unknown"] = (themeCount[s.theme || "unknown"] || 0) + 1; });
  const themes = Object.entries(themeCount).sort((a, b) => b[1] - a[1]);

  // MITRE coverage
  const mitreCounts: Record<string, number> = {};
  sessions.forEach(s => ((s.mitreAttackIds as string[]) || []).forEach(t => { mitreCounts[t] = (mitreCounts[t] || 0) + 1; }));
  const topMitre = Object.entries(mitreCounts).sort((a, b) => b[1] - a[1]).slice(0, 20);

  // Difficulty distribution
  const diffCount: Record<string, number> = {};
  sessions.forEach(s => { diffCount[s.difficulty || "INTERMEDIATE"] = (diffCount[s.difficulty || "INTERMEDIATE"] || 0) + 1; });

  // Monthly trend
  const monthlyCount: Record<string, number> = {};
  sessions.forEach(s => {
    const m = new Date(s.createdAt).toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
    monthlyCount[m] = (monthlyCount[m] || 0) + 1;
  });

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl font-bold text-white">Threat Intelligence</h1><p className="text-gray-500 text-xs mt-1">Platform-wide threat landscape from {sessions.length} exercises</p></div>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <div className="cyber-card">
          <h2 className="text-white text-sm font-semibold mb-3">Threat Themes</h2>
          <div className="space-y-2">{themes.map(([theme, count]) => (
            <div key={theme} className="flex items-center justify-between">
              <span className="text-gray-300 text-xs capitalize">{theme.replace(/-/g, " ")}</span>
              <div className="flex items-center gap-2"><div className="w-24 h-1.5 bg-surface-3 rounded-full"><div className="h-full bg-cyber-500 rounded-full" style={{ width: `${(count / sessions.length) * 100}%` }} /></div><span className="text-gray-500 text-xs w-8 text-right">{count}</span></div>
            </div>
          ))}</div>
        </div>

        <div className="cyber-card">
          <h2 className="text-white text-sm font-semibold mb-3">Difficulty Distribution</h2>
          <div className="space-y-2">{Object.entries(diffCount).sort((a, b) => b[1] - a[1]).map(([diff, count]) => (
            <div key={diff} className="flex items-center justify-between">
              <span className="text-gray-300 text-xs">{diff}</span>
              <div className="flex items-center gap-2"><div className="w-24 h-1.5 bg-surface-3 rounded-full"><div className="h-full bg-yellow-500 rounded-full" style={{ width: `${(count / sessions.length) * 100}%` }} /></div><span className="text-gray-500 text-xs w-8 text-right">{count}</span></div>
            </div>
          ))}</div>
        </div>
      </div>

      <div className="cyber-card mb-4">
        <h2 className="text-white text-sm font-semibold mb-3">Top MITRE ATT&CK Techniques</h2>
        <div className="flex flex-wrap gap-1.5">{topMitre.map(([id, count]) => (
          <span key={id} className="cyber-badge text-xs bg-cyber-600/10 text-cyber-400">{id} <span className="text-gray-500 ml-0.5">×{count}</span></span>
        ))}</div>
        {topMitre.length === 0 && <p className="text-gray-500 text-xs">No MITRE data yet</p>}
      </div>

      <div className="cyber-card">
        <h2 className="text-white text-sm font-semibold mb-3">Monthly Volume</h2>
        <div className="space-y-2">{Object.entries(monthlyCount).map(([month, count]) => (
          <div key={month} className="flex items-center justify-between">
            <span className="text-gray-400 text-xs">{month}</span>
            <div className="flex items-center gap-2"><div className="w-32 h-1.5 bg-surface-3 rounded-full"><div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min((count / 20) * 100, 100)}%` }} /></div><span className="text-gray-500 text-xs w-8 text-right">{count}</span></div>
          </div>
        ))}</div>
      </div>
    </div>
  );
}
