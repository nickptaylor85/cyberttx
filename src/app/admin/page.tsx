import { db } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getStats() {
  const [orgCount, userCount, sessionCount, activeSessionCount] = await Promise.all([
    db.organization.count(),
    db.user.count(),
    db.ttxSession.count(),
    db.ttxSession.count({ where: { status: "IN_PROGRESS" } }),
  ]);

  const recentOrgs = await db.organization.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { users: true, ttxSessions: true } } },
  });

  const recentSessions = await db.ttxSession.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      organization: { select: { name: true, slug: true } },
      _count: { select: { participants: true } },
    },
  });

  return { orgCount, userCount, sessionCount, activeSessionCount, recentOrgs, recentSessions };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const statCards = [
    { label: "Client Portals", value: stats.orgCount, icon: "🏢", color: "text-cyber-400" },
    { label: "Total Users", value: stats.userCount, icon: "👥", color: "text-blue-400" },
    { label: "TTX Sessions", value: stats.sessionCount, icon: "🎯", color: "text-purple-400" },
    { label: "Live Now", value: stats.activeSessionCount, icon: "⚡", color: "text-green-400" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Platform Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your CyberTTX platform</p>
        </div>
        <Link href="/admin/clients" className="cyber-btn-primary">
          + New Client Portal
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, i) => (
          <div key={i} className="cyber-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{stat.icon}</span>
              <span className={`font-display text-2xl font-bold ${stat.color}`}>{stat.value}</span>
            </div>
            <p className="text-gray-500 text-sm">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Clients */}
        <div className="cyber-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-white">Recent Clients</h2>
            <Link href="/admin/clients" className="text-cyber-400 text-sm hover:text-cyber-300">View All →</Link>
          </div>
          <div className="space-y-3">
            {stats.recentOrgs.length === 0 && (
              <p className="text-gray-500 text-sm py-4 text-center">No clients yet. Create your first portal!</p>
            )}
            {stats.recentOrgs.map((org) => (
              <div key={org.id} className="flex items-center justify-between py-2 border-b border-surface-3 last:border-0">
                <div>
                  <p className="text-white text-sm font-medium">{org.name}</p>
                  <p className="text-gray-500 text-xs">{org.slug}.cyberttx.com</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span>{org._count.users} users</span>
                  <span>{org._count.ttxSessions} sessions</span>
                  <span className={`cyber-badge ${org.isDemo ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" : "bg-cyber-500/20 text-cyber-400 border-cyber-500/30"}`}>
                    {org.isDemo ? "Demo" : org.plan}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="cyber-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-white">Recent TTX Sessions</h2>
          </div>
          <div className="space-y-3">
            {stats.recentSessions.length === 0 && (
              <p className="text-gray-500 text-sm py-4 text-center">No sessions yet.</p>
            )}
            {stats.recentSessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between py-2 border-b border-surface-3 last:border-0">
                <div>
                  <p className="text-white text-sm font-medium">{session.title}</p>
                  <p className="text-gray-500 text-xs">{session.organization.name}</p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-gray-400">{session._count.participants} players</span>
                  <span className={`cyber-badge ${
                    session.status === "IN_PROGRESS" ? "bg-green-500/20 text-green-400 border-green-500/30" :
                    session.status === "COMPLETED" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                    session.status === "LOBBY" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
                    "bg-gray-500/20 text-gray-400 border-gray-500/30"
                  }`}>{session.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
