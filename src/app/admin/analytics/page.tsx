import { db } from "@/lib/db";
export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  // Core metrics
  const [totalSessions, completedSessions, cancelledSessions, totalUsers, totalOrgs, activeUsers] = await Promise.all([
    db.ttxSession.count(),
    db.ttxSession.count({ where: { status: "COMPLETED" } }),
    db.ttxSession.count({ where: { status: "CANCELLED" } }),
    db.user.count({ where: { clerkId: { not: { startsWith: "pending_" } } } }),
    db.organization.count(),
    db.user.count({ where: { clerkId: { startsWith: "hash:" }, isActive: true } }),
  ]);

  const pendingInvites = await db.user.count({ where: { clerkId: { startsWith: "pending_" } } });
  const inProgressSessions = await db.ttxSession.count({ where: { status: "IN_PROGRESS" } });
  const generatingSessions = await db.ttxSession.count({ where: { status: "GENERATING" } });
  const completionRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;
  const cancelRate = totalSessions > 0 ? Math.round((cancelledSessions / totalSessions) * 100) : 0;

  // Top clients by usage
  const topClients = await db.organization.findMany({
    select: { name: true, plan: true, isDemo: true, _count: { select: { ttxSessions: true, users: true } } },
    orderBy: { ttxSessions: { _count: "desc" } }, take: 10,
  });

  // Theme breakdown
  const allSessions = await db.ttxSession.findMany({
    select: { theme: true, status: true, difficulty: true, createdAt: true, completedAt: true, mitreAttackIds: true },
  });

  const themeBreakdown: Record<string, { total: number; completed: number }> = {};
  const difficultyBreakdown: Record<string, { total: number; completed: number }> = {};
  const monthlyActivity: Record<string, { created: number; completed: number }> = {};
  const mitreUsage: Record<string, number> = {};

  allSessions.forEach(s => {
    const theme = s.theme || "unknown";
    if (!themeBreakdown[theme]) themeBreakdown[theme] = { total: 0, completed: 0 };
    themeBreakdown[theme].total++;
    if (s.status === "COMPLETED") themeBreakdown[theme].completed++;

    const diff = s.difficulty || "INTERMEDIATE";
    if (!difficultyBreakdown[diff]) difficultyBreakdown[diff] = { total: 0, completed: 0 };
    difficultyBreakdown[diff].total++;
    if (s.status === "COMPLETED") difficultyBreakdown[diff].completed++;

    const month = new Date(s.createdAt).toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
    if (!monthlyActivity[month]) monthlyActivity[month] = { created: 0, completed: 0 };
    monthlyActivity[month].created++;
    if (s.status === "COMPLETED") monthlyActivity[month].completed++;

    ((s.mitreAttackIds as string[]) || []).forEach(t => { mitreUsage[t] = (mitreUsage[t] || 0) + 1; });
  });

  const sortedThemes = Object.entries(themeBreakdown).sort((a, b) => b[1].total - a[1].total);
  const sortedDifficulty = Object.entries(difficultyBreakdown).sort((a, b) => b[1].total - a[1].total);
  const sortedMitre = Object.entries(mitreUsage).sort((a, b) => b[1] - a[1]);

  // Accuracy across platform
  const allAnswers = await db.ttxAnswer.count();
  const correctAnswers = await db.ttxAnswer.count({ where: { isCorrect: true } });
  const platformAccuracy = allAnswers > 0 ? Math.round((correctAnswers / allAnswers) * 100) : 0;

  // Avg time to complete (sessions with both created and completed)
  const completedWithDates = allSessions.filter(s => s.status === "COMPLETED" && s.completedAt);
  const avgCompletionMinutes = completedWithDates.length > 0
    ? Math.round(completedWithDates.reduce((a, s) => a + (new Date(s.completedAt!).getTime() - new Date(s.createdAt).getTime()) / 60000, 0) / completedWithDates.length)
    : 0;

  // Recent signups (last 7 days)
  const recentSignups = await db.user.count({
    where: { createdAt: { gte: new Date(Date.now() - 7 * 86400000) }, clerkId: { startsWith: "hash:" } },
  });

  // Plans breakdown
  const planCounts = await db.organization.groupBy({ by: ["plan"], _count: { plan: true } });

  const pc: Record<string, string> = { FREE: "text-gray-400", STARTER: "text-green-400", GROWTH: "text-cyan-400", PROFESSIONAL: "text-blue-400", ENTERPRISE: "text-purple-400" };
  const dc: Record<string, string> = { BEGINNER: "text-green-400", INTERMEDIATE: "text-cyan-400", ADVANCED: "text-orange-400", EXPERT: "text-red-400" };

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl sm:text-2xl font-bold text-white">Platform Analytics</h1><p className="text-gray-500 text-xs mt-1">Comprehensive metrics across all portals</p></div>

      {/* KPI Row 1 — Usage */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-cyber-400">{totalSessions}</p><p className="text-gray-500 text-xs">Total Exercises</p></div>
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-green-400">{completedSessions}</p><p className="text-gray-500 text-xs">Completed</p></div>
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-yellow-400">{completionRate}%</p><p className="text-gray-500 text-xs">Completion Rate</p></div>
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-blue-400">{platformAccuracy}%</p><p className="text-gray-500 text-xs">Platform Accuracy</p></div>
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-white">{avgCompletionMinutes}m</p><p className="text-gray-500 text-xs">Avg Completion</p></div>
      </div>

      {/* KPI Row 2 — Users & Orgs */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-white">{totalOrgs}</p><p className="text-gray-500 text-xs">Portals</p></div>
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-cyan-400">{activeUsers}</p><p className="text-gray-500 text-xs">Active Users</p></div>
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-yellow-400">{pendingInvites}</p><p className="text-gray-500 text-xs">Pending Invites</p></div>
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-green-400">{recentSignups}</p><p className="text-gray-500 text-xs">Signups (7d)</p></div>
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-purple-400">{inProgressSessions}</p><p className="text-gray-500 text-xs">In Progress</p></div>
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-red-400">{cancelRate}%</p><p className="text-gray-500 text-xs">Cancel Rate</p></div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        {/* Theme Breakdown */}
        <div className="cyber-card">
          <h2 className="text-white text-sm font-semibold mb-3">Exercises by Theme</h2>
          <div className="space-y-2">{sortedThemes.map(([theme, stats]) => {
            const pct = totalSessions > 0 ? Math.round((stats.total / totalSessions) * 100) : 0;
            const compRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
            return (
              <div key={theme}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-gray-300 text-xs capitalize">{theme.replace(/-/g, " ")}</span>
                  <span className="text-gray-500 text-xs">{stats.total} ({compRate}% completed)</span>
                </div>
                <div className="h-1.5 bg-surface-3 rounded-full"><div className="h-full bg-cyber-500 rounded-full" style={{ width: `${pct}%` }} /></div>
              </div>
            );
          })}</div>
        </div>

        {/* Difficulty Breakdown */}
        <div className="cyber-card">
          <h2 className="text-white text-sm font-semibold mb-3">Exercises by Difficulty</h2>
          <div className="space-y-3">{sortedDifficulty.map(([diff, stats]) => {
            const pct = totalSessions > 0 ? Math.round((stats.total / totalSessions) * 100) : 0;
            const compRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
            return (
              <div key={diff} className="flex items-center justify-between py-1.5 border-b border-surface-3/50 last:border-0">
                <div className="flex items-center gap-2"><span className={`text-sm font-semibold ${dc[diff] || "text-gray-400"}`}>{diff}</span></div>
                <div className="text-right"><p className="text-white text-sm">{stats.total} exercises</p><p className="text-gray-500 text-xs">{compRate}% completion</p></div>
              </div>
            );
          })}</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        {/* Plans Distribution */}
        <div className="cyber-card">
          <h2 className="text-white text-sm font-semibold mb-3">Portals by Plan</h2>
          <div className="space-y-2">{planCounts.sort((a, b) => b._count.plan - a._count.plan).map(p => (
            <div key={p.plan} className="flex items-center justify-between py-1.5 border-b border-surface-3/50 last:border-0">
              <span className={`text-sm font-semibold ${pc[p.plan] || "text-gray-400"}`}>{p.plan}</span>
              <div className="flex items-center gap-3">
                <span className="text-white text-sm font-mono">{p._count.plan}</span>
                <div className="w-24 h-1.5 bg-surface-3 rounded-full"><div className="h-full bg-cyber-500 rounded-full" style={{ width: `${Math.round((p._count.plan / totalOrgs) * 100)}%` }} /></div>
              </div>
            </div>
          ))}</div>
        </div>

        {/* MITRE Coverage */}
        <div className="cyber-card">
          <h2 className="text-white text-sm font-semibold mb-3">Top MITRE Techniques (Platform-wide)</h2>
          {sortedMitre.length === 0 ? <p className="text-gray-500 text-xs">No MITRE data yet</p> :
            <div className="space-y-1.5">{sortedMitre.slice(0, 12).map(([tech, count]) => (
              <div key={tech} className="flex items-center justify-between py-1 border-b border-surface-3/30 last:border-0">
                <span className="text-gray-300 text-xs font-mono">{tech}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1 bg-surface-3 rounded-full"><div className="h-full bg-cyber-500 rounded-full" style={{ width: `${Math.round((count / (sortedMitre[0]?.[1] || 1)) * 100)}%` }} /></div>
                  <span className="text-gray-500 text-xs w-6 text-right">{count}</span>
                </div>
              </div>
            ))}</div>
          }
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        {/* Top Clients */}
        <div className="cyber-card">
          <h2 className="text-white text-sm font-semibold mb-3">Top Clients by Usage</h2>
          <div className="space-y-2">{topClients.map(o => (
            <div key={o.name} className="flex items-center justify-between py-1.5 border-b border-surface-3/50 last:border-0">
              <div>
                <p className="text-white text-sm">{o.name}</p>
                <p className="text-gray-600 text-xs"><span className={pc[o.plan]}>{o.plan}</span>{o.isDemo ? " · Demo" : ""}</p>
              </div>
              <div className="flex gap-4 text-xs text-gray-500"><span>{o._count.ttxSessions} exercises</span><span>{o._count.users} users</span></div>
            </div>
          ))}</div>
        </div>

        {/* Monthly Activity */}
        <div className="cyber-card">
          <h2 className="text-white text-sm font-semibold mb-3">Monthly Activity</h2>
          {Object.keys(monthlyActivity).length === 0 ? <p className="text-gray-500 text-xs">No activity yet</p> :
            <div className="overflow-x-auto"><table className="w-full text-xs">
              <thead><tr className="border-b border-surface-3"><th className="text-gray-500 font-normal py-1.5 text-left">Month</th><th className="text-gray-500 font-normal py-1.5 text-right">Created</th><th className="text-gray-500 font-normal py-1.5 text-right">Completed</th><th className="text-gray-500 font-normal py-1.5 text-right">Rate</th></tr></thead>
              <tbody>{Object.entries(monthlyActivity).map(([month, stats]) => (
                <tr key={month} className="border-b border-surface-3/30">
                  <td className="text-gray-400 py-1">{month}</td>
                  <td className="text-white text-right font-mono">{stats.created}</td>
                  <td className="text-green-400 text-right font-mono">{stats.completed}</td>
                  <td className={`text-right font-mono ${stats.created > 0 ? Math.round((stats.completed / stats.created) * 100) >= 50 ? "text-green-400" : "text-yellow-400" : "text-gray-500"}`}>
                    {stats.created > 0 ? Math.round((stats.completed / stats.created) * 100) : 0}%
                  </td>
                </tr>
              ))}</tbody>
            </table></div>
          }
        </div>
      </div>

      {/* Platform Health */}
      <div className="cyber-card">
        <h2 className="text-white text-sm font-semibold mb-3">Platform Health</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-surface-0 border border-surface-3">
            <p className="text-gray-500 text-xs mb-1">Stuck Sessions</p>
            <p className={`font-display text-xl font-bold ${generatingSessions > 0 ? "text-yellow-400" : "text-green-400"}`}>{generatingSessions}</p>
            <p className="text-gray-600 text-xs">Currently generating</p>
          </div>
          <div className="p-3 rounded-lg bg-surface-0 border border-surface-3">
            <p className="text-gray-500 text-xs mb-1">Questions Answered</p>
            <p className="font-display text-xl font-bold text-white">{allAnswers.toLocaleString()}</p>
            <p className="text-gray-600 text-xs">{correctAnswers.toLocaleString()} correct</p>
          </div>
          <div className="p-3 rounded-lg bg-surface-0 border border-surface-3">
            <p className="text-gray-500 text-xs mb-1">Avg Users/Portal</p>
            <p className="font-display text-xl font-bold text-cyan-400">{totalOrgs > 0 ? (totalUsers / totalOrgs).toFixed(1) : "0"}</p>
            <p className="text-gray-600 text-xs">{totalUsers} total users</p>
          </div>
          <div className="p-3 rounded-lg bg-surface-0 border border-surface-3">
            <p className="text-gray-500 text-xs mb-1">Avg Exercises/Portal</p>
            <p className="font-display text-xl font-bold text-purple-400">{totalOrgs > 0 ? (totalSessions / totalOrgs).toFixed(1) : "0"}</p>
            <p className="text-gray-600 text-xs">Across {totalOrgs} portals</p>
          </div>
        </div>
      </div>
    </div>
  );
}
