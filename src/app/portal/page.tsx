import { db } from "@/lib/db";
import { headers } from "next/headers";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getOrgFromHeaders() {
  const headersList = await headers();
  const slug = headersList.get("x-org-slug") || "demo";
  return db.organization.findUnique({
    where: { slug },
    include: {
      _count: { select: { users: true, ttxSessions: true } },
    },
  });
}

async function getRecentSessions(orgId: string) {
  return db.ttxSession.findMany({
    where: { orgId },
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { participants: true } } },
  });
}

async function getTopPlayers(orgId: string) {
  const participants = await db.ttxParticipant.findMany({
    where: { session: { orgId } },
    include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } },
    orderBy: { totalScore: "desc" },
    take: 5,
  });

  // Aggregate by user
  const playerScores = new Map<string, { user: typeof participants[0]["user"]; totalScore: number; sessions: number }>();
  participants.forEach((p) => {
    const existing = playerScores.get(p.userId);
    if (existing) {
      existing.totalScore += p.totalScore;
      existing.sessions += 1;
    } else {
      playerScores.set(p.userId, { user: p.user, totalScore: p.totalScore, sessions: 1 });
    }
  });

  return Array.from(playerScores.values())
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 5);
}

export default async function PortalDashboard() {
  const org = await getOrgFromHeaders();
  if (!org) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400 text-lg">Organization not found</p>
        <p className="text-gray-500 mt-2">This portal doesn&apos;t exist or has been deactivated.</p>
      </div>
    );
  }

  const [sessions, topPlayers] = await Promise.all([
    getRecentSessions(org.id),
    getTopPlayers(org.id),
  ]);

  const liveSessions = sessions.filter((s) => s.status === "IN_PROGRESS" || s.status === "LOBBY");

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">{org.name}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {org._count.users} team members · {org._count.ttxSessions} exercises run
          </p>
        </div>
        <Link href="/portal/ttx/new" className="cyber-btn-primary">
          🎯 New Exercise
        </Link>
      </div>

      {/* Live Sessions Alert */}
      {liveSessions.length > 0 && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-4">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <div className="flex-1">
            <p className="text-green-400 font-medium text-sm">
              {liveSessions.length} live session{liveSessions.length > 1 ? "s" : ""} in progress
            </p>
          </div>
          <Link href={`/portal/ttx`} className="text-green-400 text-sm hover:text-green-300">
            Join →
          </Link>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quick Stats */}
        <div className="lg:col-span-2 grid grid-cols-3 gap-4">
          {[
            { label: "TTX This Month", value: org.ttxUsedThisMonth, max: org.maxTtxPerMonth, icon: "🎯" },
            { label: "Team Members", value: org._count.users, max: org.maxUsers, icon: "👥" },
            { label: "Total Sessions", value: org._count.ttxSessions, max: null, icon: "📊" },
          ].map((stat, i) => (
            <div key={i} className="cyber-card">
              <span className="text-xl">{stat.icon}</span>
              <p className="font-display text-2xl font-bold text-white mt-2">{stat.value}</p>
              <p className="text-gray-500 text-sm">
                {stat.label}
                {stat.max && <span className="text-gray-600"> / {stat.max}</span>}
              </p>
              {stat.max && (
                <div className="mt-2 h-1 bg-surface-3 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyber-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (stat.value / stat.max) * 100)}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Top Players */}
        <div className="cyber-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-base font-semibold text-white">🏆 Top Players</h2>
            <Link href="/portal/leaderboard" className="text-cyber-400 text-xs hover:text-cyber-300">View All →</Link>
          </div>
          {topPlayers.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">No scores yet. Run your first TTX!</p>
          ) : (
            <div className="space-y-3">
              {topPlayers.map((player, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-lg w-6 text-center">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">
                      {player.user.firstName} {player.user.lastName}
                    </p>
                    <p className="text-gray-500 text-xs">{player.sessions} sessions</p>
                  </div>
                  <span className="font-mono text-cyber-400 text-sm font-semibold">
                    {player.totalScore.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="mt-6 cyber-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-base font-semibold text-white">Recent Exercises</h2>
          <Link href="/portal/ttx" className="text-cyber-400 text-xs hover:text-cyber-300">View All →</Link>
        </div>
        {sessions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-3xl mb-2">🎯</p>
            <p className="text-gray-400 mb-3">No exercises yet</p>
            <Link href="/portal/ttx/new" className="cyber-btn-primary text-sm">Launch Your First TTX</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => (
              <Link
                key={session.id}
                href={`/portal/ttx/${session.id}`}
                className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-surface-2 transition-colors"
              >
                <div>
                  <p className="text-white text-sm font-medium">{session.title}</p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {session.difficulty} · {session.theme} · {session._count.participants} players
                  </p>
                </div>
                <span className={`cyber-badge ${
                  session.status === "IN_PROGRESS" ? "bg-green-500/20 text-green-400 border-green-500/30" :
                  session.status === "COMPLETED" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                  session.status === "LOBBY" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
                  "bg-gray-500/20 text-gray-400 border-gray-500/30"
                }`}>{session.status.replace("_", " ")}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
