import { db } from "@/lib/db";
import { getAuthUser, getPortalOrg } from "@/lib/auth-helpers";
export const dynamic = "force-dynamic";

export default async function MyPerformancePage() {
  const user = await getAuthUser();
  const org = await getPortalOrg();
  if (!user || !org) return <p className="text-red-400 p-8">Not authenticated</p>;

  // Get THIS user's participations with scores
  const participations = await db.ttxParticipant.findMany({
    where: { userId: user.id, session: { orgId: org.id, status: "COMPLETED" } },
    include: {
      session: { select: { title: true, theme: true, difficulty: true, completedAt: true, createdAt: true } },
      answers: { select: { isCorrect: true } },
    },
    orderBy: { session: { createdAt: "desc" } },
  });

  const myData = participations.map(p => {
    const correct = p.answers.filter(a => a.isCorrect).length;
    const total = p.answers.length;
    return {
      title: p.session.title, theme: p.session.theme, difficulty: p.session.difficulty,
      date: p.session.completedAt || p.session.createdAt,
      accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
      correct, total, score: p.totalScore,
    };
  });

  const avgAcc = myData.length > 0 ? Math.round(myData.reduce((a, d) => a + d.accuracy, 0) / myData.length) : 0;
  const bestAcc = myData.length > 0 ? Math.max(...myData.map(d => d.accuracy)) : 0;
  const trend = myData.length >= 2 ? myData[0].accuracy - myData[myData.length - 1].accuracy : 0;
  const totalQ = myData.reduce((a, d) => a + d.total, 0);
  const totalCorrect = myData.reduce((a, d) => a + d.correct, 0);

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl sm:text-2xl font-bold text-white">My Performance</h1><p className="text-gray-500 text-xs mt-1">{user.firstName ? `${user.firstName}'s` : "Your"} personal progress</p></div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-cyber-400">{myData.length}</p><p className="text-gray-500 text-xs">Exercises</p></div>
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-green-400">{avgAcc}%</p><p className="text-gray-500 text-xs">Avg Accuracy</p></div>
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-yellow-400">{bestAcc}%</p><p className="text-gray-500 text-xs">Best Score</p></div>
        <div className="cyber-card text-center"><p className={`font-display text-2xl font-bold ${trend >= 0 ? "text-green-400" : "text-red-400"}`}>{trend >= 0 ? "+" : ""}{trend}%</p><p className="text-gray-500 text-xs">Trend</p></div>
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-white">{totalCorrect}/{totalQ}</p><p className="text-gray-500 text-xs">Questions Right</p></div>
      </div>

      {myData.length === 0 ? (
        <div className="cyber-card text-center py-12"><p className="text-gray-400">Complete your first exercise to see your performance</p></div>
      ) : (
        <div className="space-y-2">{myData.map((d, i) => (
          <div key={i} className="cyber-card">
            <div className="flex items-center justify-between mb-2">
              <div className="min-w-0 mr-3"><p className="text-white text-sm font-medium truncate">{d.title}</p><p className="text-gray-500 text-xs">{d.theme} · {d.difficulty} · {d.correct}/{d.total} correct · {new Date(d.date).toLocaleDateString("en-GB")}</p></div>
              <span className={`font-mono text-sm font-bold ${d.accuracy >= 70 ? "text-green-400" : d.accuracy >= 40 ? "text-yellow-400" : "text-red-400"}`}>{d.accuracy}%</span>
            </div>
            <div className="h-1.5 bg-surface-3 rounded-full"><div className={`h-full rounded-full ${d.accuracy >= 70 ? "bg-green-500" : d.accuracy >= 40 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${d.accuracy}%` }} /></div>
          </div>
        ))}</div>
      )}
    </div>
  );
}
