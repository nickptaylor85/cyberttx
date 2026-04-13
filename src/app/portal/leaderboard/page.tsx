import { db } from "@/lib/db";
import { getPortalOrg, getAuthUser } from "@/lib/auth-helpers";
export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const org = await getPortalOrg();
  const user = await getAuthUser();
  if (!org) return <p className="text-red-400 p-8">Not found</p>;

  const participants = await db.ttxParticipant.findMany({
    where: { session: { orgId: org.id, status: "COMPLETED" } },
    include: {
      user: { select: { id: true, firstName: true, lastName: true } },
      session: { select: { title: true, difficulty: true, theme: true, completedAt: true, createdAt: true } },
      answers: { select: { isCorrect: true } },
    },
  });

  // Aggregate by user
  const userMap: Record<string, { name: string; id: string; exercises: number; correct: number; total: number; themes: Set<string>; lastExercise: Date }> = {};
  participants.forEach(p => {
    const uid = p.user.id;
    if (!userMap[uid]) userMap[uid] = { name: `${p.user.firstName || ""} ${p.user.lastName || ""}`.trim() || "Unknown", id: uid, exercises: 0, correct: 0, total: 0, themes: new Set(), lastExercise: new Date(0) };
    userMap[uid].exercises++;
    userMap[uid].correct += p.answers.filter(a => a.isCorrect).length;
    userMap[uid].total += p.answers.length;
    if (p.session.theme) userMap[uid].themes.add(p.session.theme);
    const d = new Date(p.session.completedAt || p.session.createdAt);
    if (d > userMap[uid].lastExercise) userMap[uid].lastExercise = d;
  });

  const leaderboard = Object.values(userMap)
    .map(u => ({ ...u, accuracy: u.total > 0 ? Math.round((u.correct / u.total) * 100) : 0, themeCount: u.themes.size }))
    .sort((a, b) => b.accuracy - a.accuracy || b.exercises - a.exercises);

  // Last week leaderboard for rank delta
  const weekAgo = new Date(Date.now() - 7 * 86400000);
  const lastWeekMap: Record<string, { correct: number; total: number; exercises: number }> = {};
  participants.forEach(p => {
    const d = new Date(p.session.completedAt || p.session.createdAt);
    if (d < weekAgo) {
      const uid = p.user.id;
      if (!lastWeekMap[uid]) lastWeekMap[uid] = { correct: 0, total: 0, exercises: 0 };
      lastWeekMap[uid].exercises++;
      lastWeekMap[uid].correct += p.answers.filter(a => a.isCorrect).length;
      lastWeekMap[uid].total += p.answers.length;
    }
  });
  const lastWeekBoard = Object.entries(lastWeekMap)
    .map(([id, u]) => ({ id, accuracy: u.total > 0 ? Math.round((u.correct / u.total) * 100) : 0 }))
    .sort((a, b) => b.accuracy - a.accuracy);
  const lastWeekRank: Record<string, number> = {};
  lastWeekBoard.forEach((u, i) => { lastWeekRank[u.id] = i + 1; });

  // This month's leaderboard
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthMap: Record<string, { name: string; correct: number; total: number; exercises: number }> = {};
  participants.forEach(p => {
    const d = new Date(p.session.completedAt || p.session.createdAt);
    if (d >= startOfMonth) {
      const uid = p.user.id;
      if (!monthMap[uid]) monthMap[uid] = { name: `${p.user.firstName || ""} ${p.user.lastName || ""}`.trim(), correct: 0, total: 0, exercises: 0 };
      monthMap[uid].exercises++;
      monthMap[uid].correct += p.answers.filter(a => a.isCorrect).length;
      monthMap[uid].total += p.answers.length;
    }
  });
  const monthlyBoard = Object.values(monthMap)
    .map(u => ({ ...u, accuracy: u.total > 0 ? Math.round((u.correct / u.total) * 100) : 0 }))
    .sort((a, b) => b.accuracy - a.accuracy);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl sm:text-2xl font-bold text-white">Leaderboard</h1><p className="text-gray-500 text-xs mt-1">{leaderboard.length} team members · {participants.length} total attempts</p></div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* All Time */}
        <div className="cyber-card">
          <h2 className="text-white text-sm font-semibold mb-4">All Time</h2>
          {leaderboard.length === 0 ? <p className="text-gray-500 text-xs text-center py-4">No data yet</p> :
            <div className="space-y-3">{leaderboard.map((u, i) => (
              <div key={u.id} className={`flex items-center gap-3 p-2 rounded-lg ${i < 3 ? "bg-surface-0 border border-surface-3" : ""} ${u.id === user?.id ? "ring-1 ring-cyber-500/30" : ""}`}>
                <span className="text-lg w-8 text-center flex-shrink-0">{i < 3 ? medals[i] : <span className="text-gray-600 text-sm font-mono">#{i + 1}</span>}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{u.name}{u.id === user?.id ? " (you)" : ""}</p>
                  <p className="text-gray-500 text-xs">{u.exercises} exercises · {u.themeCount} themes</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`font-mono text-base font-bold ${u.accuracy >= 70 ? "text-green-400" : u.accuracy >= 40 ? "text-yellow-400" : "text-red-400"}`}>{u.accuracy}%</p>
                  <div className="flex items-center justify-end gap-1">
                    <p className="text-gray-600 text-xs">{u.correct}/{u.total}</p>
                    {lastWeekRank[u.id] && (() => {
                      const delta = lastWeekRank[u.id] - (i + 1);
                      if (delta > 0) return <span className="text-green-400 text-xs">▲{delta}</span>;
                      if (delta < 0) return <span className="text-red-400 text-xs">▼{Math.abs(delta)}</span>;
                      return <span className="text-gray-600 text-xs">—</span>;
                    })()}
                  </div>
                </div>
              </div>
            ))}</div>
          }
        </div>

        {/* This Month */}
        <div className="cyber-card">
          <h2 className="text-white text-sm font-semibold mb-4">This Month ({now.toLocaleDateString("en-GB", { month: "long" })})</h2>
          {monthlyBoard.length === 0 ? <p className="text-gray-500 text-xs text-center py-4">No exercises this month</p> :
            <div className="space-y-3">{monthlyBoard.map((u, i) => (
              <div key={i} className={`flex items-center gap-3 p-2 rounded-lg ${i < 3 ? "bg-surface-0 border border-surface-3" : ""}`}>
                <span className="text-lg w-8 text-center flex-shrink-0">{i < 3 ? medals[i] : <span className="text-gray-600 text-sm font-mono">#{i + 1}</span>}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{u.name}</p>
                  <p className="text-gray-500 text-xs">{u.exercises} exercises this month</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`font-mono text-base font-bold ${u.accuracy >= 70 ? "text-green-400" : u.accuracy >= 40 ? "text-yellow-400" : "text-red-400"}`}>{u.accuracy}%</p>
                </div>
              </div>
            ))}</div>
          }
        </div>
      </div>
    </div>
  );
}
