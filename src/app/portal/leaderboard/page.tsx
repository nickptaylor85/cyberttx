import { db } from "@/lib/db";
import { headers } from "next/headers";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getOrg() {
  const headersList = await headers();
  const slug = headersList.get("x-org-slug") || "demo";
  return db.organization.findUnique({ where: { slug } });
}

async function getAllTimeLeaderboard(orgId: string) {
  const participants = await db.ttxParticipant.findMany({
    where: {
      session: { orgId, status: "COMPLETED" },
    },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      session: { select: { title: true, difficulty: true } },
    },
  });

  // Aggregate by user
  const userMap = new Map<string, {
    user: typeof participants[0]["user"];
    totalScore: number;
    sessionsPlayed: number;
    avgScore: number;
    bestScore: number;
    bestSession: string;
  }>();

  participants.forEach((p) => {
    const existing = userMap.get(p.userId);
    if (existing) {
      existing.totalScore += p.totalScore;
      existing.sessionsPlayed += 1;
      if (p.totalScore > existing.bestScore) {
        existing.bestScore = p.totalScore;
        existing.bestSession = p.session.title;
      }
      existing.avgScore = Math.round(existing.totalScore / existing.sessionsPlayed);
    } else {
      userMap.set(p.userId, {
        user: p.user,
        totalScore: p.totalScore,
        sessionsPlayed: 1,
        avgScore: p.totalScore,
        bestScore: p.totalScore,
        bestSession: p.session.title,
      });
    }
  });

  return Array.from(userMap.values()).sort((a, b) => b.totalScore - a.totalScore);
}

async function getRecentSessionScores(orgId: string) {
  return db.ttxSession.findMany({
    where: { orgId, status: "COMPLETED" },
    take: 10,
    orderBy: { completedAt: "desc" },
    include: {
      participants: {
        orderBy: { totalScore: "desc" },
        include: {
          user: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });
}

export default async function LeaderboardPage() {
  const org = await getOrg();
  if (!org) return <p className="text-red-400">Organization not found</p>;

  const [allTime, recentSessions] = await Promise.all([
    getAllTimeLeaderboard(org.id),
    getRecentSessionScores(org.id),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">🏆 Leaderboard</h1>
          <p className="text-gray-500 text-sm mt-1">Rankings across all completed exercises</p>
        </div>
        <a href="/api/portal/leaderboard/export" className="cyber-btn-secondary text-sm">
          📥 Export PDF
        </a>
      </div>

      {/* All-Time Leaderboard */}
      <div className="cyber-card mb-8">
        <h2 className="font-display text-lg font-semibold text-white mb-6">All-Time Rankings</h2>

        {allTime.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-3xl mb-2">🎯</p>
            <p className="text-gray-400">No completed exercises yet</p>
            <Link href="/portal/ttx/new" className="cyber-btn-primary text-sm mt-4 inline-block">Run Your First TTX</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Top 3 podium */}
            {allTime.length >= 3 && (
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[1, 0, 2].map((idx) => {
                  const player = allTime[idx];
                  if (!player) return <div key={idx} />;
                  const medals = ["🥇", "🥈", "🥉"];
                  const sizes = ["text-4xl", "text-5xl", "text-4xl"];
                  const paddings = ["pt-8", "pt-0", "pt-12"];
                  return (
                    <div key={idx} className={`text-center ${paddings[idx === 0 ? 1 : idx === 1 ? 0 : 2]}`}>
                      <p className={sizes[idx === 0 ? 1 : idx === 1 ? 0 : 2]}>{medals[idx]}</p>
                      <div className="cyber-card mt-3">
                        <p className="text-white font-semibold">{player.user.firstName} {player.user.lastName}</p>
                        <p className="font-display text-2xl font-bold text-cyber-400 mt-1">
                          {player.totalScore.toLocaleString()}
                        </p>
                        <p className="text-gray-500 text-xs mt-1">{player.sessionsPlayed} sessions</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Full table */}
            <div className="overflow-hidden rounded-lg border border-surface-3">
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-2">
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 w-12">#</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Player</th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Total Score</th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Sessions</th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Avg Score</th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Best Session</th>
                  </tr>
                </thead>
                <tbody>
                  {allTime.map((player, i) => (
                    <tr key={player.user.id} className="border-t border-surface-3 hover:bg-surface-2/50 transition-colors">
                      <td className="px-4 py-3 text-sm">
                        {i < 3 ? ["🥇", "🥈", "🥉"][i] : <span className="text-gray-500">{i + 1}</span>}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-white text-sm font-medium">{player.user.firstName} {player.user.lastName}</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-mono text-cyber-400 font-semibold">{player.totalScore.toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-400 text-sm">{player.sessionsPlayed}</td>
                      <td className="px-4 py-3 text-right text-gray-400 text-sm">{player.avgScore.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-gray-300 text-sm">{player.bestScore.toLocaleString()}</span>
                        <span className="text-gray-500 text-xs block">{player.bestSession}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Recent Session Scores */}
      <div className="cyber-card">
        <h2 className="font-display text-lg font-semibold text-white mb-4">Recent Exercise Results</h2>
        {recentSessions.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">No completed sessions</p>
        ) : (
          <div className="space-y-4">
            {recentSessions.map((session) => (
              <div key={session.id} className="border border-surface-3 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-white text-sm font-medium">{session.title}</p>
                    <p className="text-gray-500 text-xs">
                      {session.difficulty} · {session.completedAt?.toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-gray-400 text-xs">{session.participants.length} players</span>
                </div>
                <div className="space-y-1">
                  {session.participants.slice(0, 3).map((p, i) => (
                    <div key={p.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-300">
                        {["🥇", "🥈", "🥉"][i]} {p.user.firstName} {p.user.lastName}
                      </span>
                      <span className="font-mono text-cyber-400 text-xs">{p.totalScore.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
