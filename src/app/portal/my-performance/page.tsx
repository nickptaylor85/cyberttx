import { db } from "@/lib/db";
import { getAuthUser, getPortalOrg } from "@/lib/auth-helpers";
export const dynamic = "force-dynamic";

export default async function MyPerformancePage() {
  const user = await getAuthUser();
  const org = await getPortalOrg();
  if (!user || !org) return <p className="text-red-400 p-8">Not authenticated</p>;

  const participations = await db.ttxParticipant.findMany({
    where: { userId: user.id, session: { orgId: org.id, status: "COMPLETED" } },
    include: {
      session: { select: { title: true, theme: true, difficulty: true, completedAt: true, createdAt: true, mitreAttackIds: true } },
      answers: { select: { isCorrect: true, stageIndex: true } },
    },
    orderBy: { session: { createdAt: "desc" } },
  });

  const myData = participations.map(p => {
    const correct = p.answers.filter(a => a.isCorrect).length;
    const total = p.answers.length;
    return {
      title: p.session.title, theme: p.session.theme || "unknown", difficulty: p.session.difficulty,
      date: p.session.completedAt || p.session.createdAt,
      accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
      correct, total, mitre: (p.session.mitreAttackIds as string[]) || [],
    };
  });

  // Monthly breakdown
  const monthly: Record<string, { exercises: number; correct: number; total: number }> = {};
  myData.forEach(d => {
    const month = new Date(d.date).toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
    if (!monthly[month]) monthly[month] = { exercises: 0, correct: 0, total: 0 };
    monthly[month].exercises++;
    monthly[month].correct += d.correct;
    monthly[month].total += d.total;
  });
  const monthlyArr = Object.entries(monthly).map(([month, stats]) => ({
    month, ...stats, accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
  }));

  // Theme breakdown for suggestions
  const themeStats: Record<string, { correct: number; total: number }> = {};
  myData.forEach(d => {
    if (!themeStats[d.theme]) themeStats[d.theme] = { correct: 0, total: 0 };
    themeStats[d.theme].correct += d.correct;
    themeStats[d.theme].total += d.total;
  });
  const weakThemes = Object.entries(themeStats)
    .map(([theme, s]) => ({ theme, accuracy: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0, total: s.total }))
    .filter(t => t.accuracy < 70 && t.total >= 1)
    .sort((a, b) => a.accuracy - b.accuracy);

  // Trend
  const avgAcc = myData.length > 0 ? Math.round(myData.reduce((a, d) => a + d.accuracy, 0) / myData.length) : 0;
  const recent3 = myData.slice(0, 3);
  const older3 = myData.slice(Math.max(0, myData.length - 3));
  const recentAvg = recent3.length > 0 ? Math.round(recent3.reduce((a, d) => a + d.accuracy, 0) / recent3.length) : 0;
  const olderAvg = older3.length > 0 ? Math.round(older3.reduce((a, d) => a + d.accuracy, 0) / older3.length) : 0;
  const trend = recentAvg - olderAvg;
  const totalQ = myData.reduce((a, d) => a + d.total, 0);
  const totalCorrect = myData.reduce((a, d) => a + d.correct, 0);

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl sm:text-2xl font-bold text-white">My Performance</h1><p className="text-gray-500 text-xs mt-1">{user.firstName ? `${user.firstName}'s` : "Your"} progress over time</p></div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-cyber-400">{myData.length}</p><p className="text-gray-500 text-xs">Exercises</p></div>
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-green-400">{avgAcc}%</p><p className="text-gray-500 text-xs">Avg Accuracy</p></div>
        <div className="cyber-card text-center"><p className={`font-display text-2xl font-bold ${trend >= 0 ? "text-green-400" : "text-red-400"}`}>{trend >= 0 ? "+" : ""}{trend}%</p><p className="text-gray-500 text-xs">{trend >= 0 ? "Improving" : "Regression"}</p></div>
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-white">{totalCorrect}/{totalQ}</p><p className="text-gray-500 text-xs">Questions</p></div>
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-yellow-400">{Object.keys(themeStats).length}</p><p className="text-gray-500 text-xs">Themes</p></div>
      </div>

      {myData.length === 0 ? (
        <div className="cyber-card text-center py-12"><p className="text-gray-400">Complete your first exercise to see your performance</p></div>
      ) : <>
        <div className="grid lg:grid-cols-2 gap-4 mb-4">
          {/* Monthly Trend */}
          <div className="cyber-card">
            <h2 className="text-white text-sm font-semibold mb-3">Monthly Trend</h2>
            {monthlyArr.length === 0 ? <p className="text-gray-500 text-xs">Not enough data</p> :
              <div className="space-y-2">{monthlyArr.map(m => (
                <div key={m.month}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-400 text-xs">{m.month}</span>
                    <span className="text-gray-500 text-xs">{m.exercises} exercises · {m.correct}/{m.total}</span>
                    <span className={`font-mono text-xs font-bold ${m.accuracy >= 70 ? "text-green-400" : m.accuracy >= 40 ? "text-yellow-400" : "text-red-400"}`}>{m.accuracy}%</span>
                  </div>
                  <div className="h-2 bg-surface-3 rounded-full"><div className={`h-full rounded-full ${m.accuracy >= 70 ? "bg-green-500" : m.accuracy >= 40 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${m.accuracy}%` }} /></div>
                </div>
              ))}</div>
            }
          </div>

          {/* Practice Suggestions */}
          <div className="cyber-card">
            <h2 className="text-white text-sm font-semibold mb-3">Where to Practice</h2>
            {weakThemes.length === 0 ? <p className="text-green-400 text-xs">All themes above 70% — keep it up!</p> :
              <div className="space-y-2">
                <p className="text-gray-500 text-xs mb-2">These themes need more work:</p>
                {weakThemes.map(t => (
                  <div key={t.theme} className="flex items-center justify-between py-1.5 border-b border-surface-3/50 last:border-0">
                    <span className="text-white text-sm capitalize">{t.theme.replace(/-/g, " ")}</span>
                    <span className={`font-mono text-sm font-bold ${t.accuracy >= 40 ? "text-yellow-400" : "text-red-400"}`}>{t.accuracy}%</span>
                  </div>
                ))}
              </div>
            }
          </div>
        </div>

        {/* Exercise History */}
        <div className="cyber-card">
          <h2 className="text-white text-sm font-semibold mb-3">Exercise History</h2>
          <div className="space-y-2">{myData.map((d, i) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-surface-3/30 last:border-0">
              <div className="min-w-0 mr-3"><p className="text-white text-xs truncate">{d.title}</p><p className="text-gray-500 text-xs">{d.theme} · {d.difficulty} · {new Date(d.date).toLocaleDateString("en-GB")}</p></div>
              <span className={`font-mono text-sm font-bold flex-shrink-0 ${d.accuracy >= 70 ? "text-green-400" : d.accuracy >= 40 ? "text-yellow-400" : "text-red-400"}`}>{d.accuracy}%</span>
            </div>
          ))}</div>
        </div>
      </>}
    </div>
  );
}
