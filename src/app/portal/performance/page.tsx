import { db } from "@/lib/db";
import { getPortalOrg } from "@/lib/auth-helpers";
export const dynamic = "force-dynamic";

export default async function PerformancePage() {
  const org = await getPortalOrg();
  if (!org) return <p className="text-red-400 p-8">Organization not found</p>;

  const completedSessions = await db.ttxSession.findMany({
    where: { orgId: org.id, status: "COMPLETED" },
    include: { participants: { include: { answers: { select: { isCorrect: true } }, user: { select: { firstName: true, lastName: true, email: true } } } } },
    orderBy: { completedAt: "desc" },
  });

  // Aggregate per-user stats
  const userStats: Record<string, { name: string; correct: number; total: number; exercises: number }> = {};
  completedSessions.forEach(s => {
    s.participants.forEach(p => {
      const key = p.user.email;
      if (!userStats[key]) userStats[key] = { name: `${p.user.firstName || ""} ${p.user.lastName || ""}`.trim() || p.user.email, correct: 0, total: 0, exercises: 0 };
      userStats[key].correct += p.answers.filter(a => a.isCorrect).length;
      userStats[key].total += p.answers.length;
      userStats[key].exercises++;
    });
  });

  const teamMembers = Object.values(userStats).map(u => ({
    ...u, accuracy: u.total > 0 ? Math.round((u.correct / u.total) * 100) : 0,
  })).sort((a, b) => b.accuracy - a.accuracy);

  const totalCorrect = teamMembers.reduce((a, m) => a + m.correct, 0);
  const totalQ = teamMembers.reduce((a, m) => a + m.total, 0);
  const teamAvg = totalQ > 0 ? Math.round((totalCorrect / totalQ) * 100) : 0;

  // Theme breakdown
  const themeStats: Record<string, { count: number; correct: number; total: number }> = {};
  completedSessions.forEach(s => {
    const theme = s.theme || "unknown"; if (!themeStats[theme]) themeStats[theme] = { count: 0, correct: 0, total: 0 };
    themeStats[theme].count++;
    s.participants.forEach(p => {
      themeStats[theme].correct += p.answers.filter(a => a.isCorrect).length;
      themeStats[theme].total += p.answers.length;
    });
  });

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl sm:text-2xl font-bold text-white">Team Performance</h1><p className="text-gray-500 text-xs mt-1">{org.name} · {completedSessions.length} completed exercises</p></div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-cyber-400">{completedSessions.length}</p><p className="text-gray-500 text-xs">Completed</p></div>
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-green-400">{teamAvg}%</p><p className="text-gray-500 text-xs">Team Accuracy</p></div>
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-white">{teamMembers.length}</p><p className="text-gray-500 text-xs">Participants</p></div>
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-yellow-400">{Object.keys(themeStats).length}</p><p className="text-gray-500 text-xs">Themes Covered</p></div>
      </div>

      {completedSessions.length === 0 ? (
        <div className="cyber-card text-center py-12"><p className="text-gray-400">No completed exercises yet. Complete an exercise to see team performance.</p></div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="cyber-card">
            <h2 className="text-white text-sm font-semibold mb-3">Individual Performance</h2>
            <div className="space-y-2">{teamMembers.map((m, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-surface-3/50 last:border-0">
                <div><p className="text-white text-sm">{m.name}</p><p className="text-gray-500 text-xs">{m.exercises} exercises · {m.correct}/{m.total} correct</p></div>
                <span className={`font-mono text-sm font-bold ${m.accuracy >= 70 ? "text-green-400" : m.accuracy >= 40 ? "text-yellow-400" : "text-red-400"}`}>{m.accuracy}%</span>
              </div>
            ))}</div>
          </div>
          <div className="cyber-card">
            <h2 className="text-white text-sm font-semibold mb-3">Performance by Theme</h2>
            <div className="space-y-2">{Object.entries(themeStats).map(([theme, s]) => {
              const acc = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
              return (
                <div key={theme} className="flex items-center justify-between py-1.5 border-b border-surface-3/50 last:border-0">
                  <div><p className="text-white text-sm capitalize">{theme.replace(/-/g, " ")}</p><p className="text-gray-500 text-xs">{s.count} exercises</p></div>
                  <span className={`font-mono text-sm font-bold ${acc >= 70 ? "text-green-400" : acc >= 40 ? "text-yellow-400" : "text-red-400"}`}>{acc}%</span>
                </div>
              );
            })}</div>
          </div>
        </div>
      )}

      {completedSessions.length > 0 && (
        <div className="cyber-card mt-4">
          <h2 className="text-white text-sm font-semibold mb-3">Monthly Team Trend</h2>
          {(() => {
            const monthly: Record<string, { exercises: number; correct: number; total: number }> = {};
            completedSessions.forEach(s => {
              const month = new Date(s.completedAt || s.createdAt).toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
              if (!monthly[month]) monthly[month] = { exercises: 0, correct: 0, total: 0 };
              monthly[month].exercises++;
              s.participants.forEach(p => { monthly[month].correct += p.answers.filter(a => a.isCorrect).length; monthly[month].total += p.answers.length; });
            });
            const arr = Object.entries(monthly).map(([month, s]) => ({ month, ...s, accuracy: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0 }));
            return arr.length > 0 ? (
              <div className="space-y-2">{arr.map(m => (
                <div key={m.month}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-400 text-xs">{m.month}</span>
                    <span className="text-gray-500 text-xs">{m.exercises} exercises</span>
                    <span className={`font-mono text-xs font-bold ${m.accuracy >= 70 ? "text-green-400" : m.accuracy >= 40 ? "text-yellow-400" : "text-red-400"}`}>{m.accuracy}%</span>
                  </div>
                  <div className="h-2 bg-surface-3 rounded-full"><div className={`h-full rounded-full ${m.accuracy >= 70 ? "bg-green-500" : m.accuracy >= 40 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${m.accuracy}%` }} /></div>
                </div>
              ))}</div>
            ) : <p className="text-gray-500 text-xs">Not enough data</p>;
          })()}
        </div>
      )}
    </div>
  );
}
