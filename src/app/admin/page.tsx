import { db } from "@/lib/db";
import Link from "next/link";
export const dynamic = "force-dynamic";

const PLAN_PRICES: Record<string, number> = { FREE: 0, STARTER: 99, GROWTH: 599, PROFESSIONAL: 1499, ENTERPRISE: 3499 };

export default async function AdminDashboard() {
  const [orgCount, userCount, sessionCount, liveCount, orgs, recentSessions] = await Promise.all([
    db.organization.count(),
    db.user.count(),
    db.ttxSession.count(),
    db.ttxSession.count({ where: { status: "IN_PROGRESS" } }),
    db.organization.findMany({ include: { _count: { select: { users: true, ttxSessions: true } } } }),
    db.ttxSession.findMany({ take: 5, orderBy: { createdAt: "desc" }, include: { organization: { select: { name: true } }, _count: { select: { participants: true } } } }),
  ]);

  const mrr = orgs.reduce((sum, o) => sum + (PLAN_PRICES[o.plan] || 0), 0);

  // Usage alerts
  const alerts: { level: string; message: string; client: string }[] = [];
  orgs.forEach(o => {
    const usage = o.maxTtxPerMonth > 0 ? o.ttxUsedThisMonth / o.maxTtxPerMonth : 0;
    if (usage >= 0.8) alerts.push({ level: usage >= 1 ? "critical" : "warning", message: `${Math.round(usage * 100)}% of exercise limit used (${o.ttxUsedThisMonth}/${o.maxTtxPerMonth})`, client: o.name });
    if (o._count.users >= o.maxUsers * 0.9) alerts.push({ level: "warning", message: `${o._count.users}/${o.maxUsers} user seats used`, client: o.name });
  });

  const sc: Record<string, string> = { COMPLETED: "bg-green-500/20 text-green-400", IN_PROGRESS: "bg-blue-500/20 text-blue-400", CANCELLED: "bg-red-500/20 text-red-400", GENERATING: "bg-yellow-500/20 text-yellow-400", LOBBY: "bg-purple-500/20 text-purple-400" };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="font-display text-xl sm:text-2xl font-bold text-white">Platform Dashboard</h1><p className="text-gray-500 text-xs sm:text-sm mt-1">Manage your ThreatCast platform</p></div>
        <Link href="/admin/clients" className="cyber-btn-primary text-sm">+ New Client Portal</Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-cyber-400">{orgCount}</p><p className="text-gray-500 text-xs">Clients</p></div>
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-blue-400">{userCount}</p><p className="text-gray-500 text-xs">Users</p></div>
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-purple-400">{sessionCount}</p><p className="text-gray-500 text-xs">Sessions</p></div>
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-green-400">{liveCount}</p><p className="text-gray-500 text-xs">Live Now</p></div>
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-yellow-400">£{mrr.toLocaleString()}</p><p className="text-gray-500 text-xs">MRR</p></div>
      </div>

      {/* Usage alerts */}
      {alerts.length > 0 && (
        <div className="cyber-card border-orange-500/30 bg-orange-500/5 mb-6">
          <h2 className="text-orange-400 text-sm font-semibold mb-3">⚠️ Usage Alerts</h2>
          <div className="space-y-2">{alerts.map((a, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${a.level === "critical" ? "bg-red-400" : "bg-orange-400"}`} />
              <span className="text-cyber-400 font-medium">{a.client}</span>
              <span className="text-gray-400">{a.message}</span>
            </div>
          ))}</div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="cyber-card">
          <div className="flex items-center justify-between mb-3"><h2 className="text-white text-sm font-semibold">Recent Clients</h2><Link href="/admin/clients" className="text-cyber-400 text-xs">View All →</Link></div>
          <div className="space-y-2">{orgs.slice(0, 5).map(o => (
            <Link key={o.id} href={`/admin/clients/${o.id}`} className="flex items-center justify-between py-2 border-b border-surface-3/50 last:border-0 hover:bg-surface-0/50 -mx-1 px-1 rounded">
              <div><p className="text-white text-sm">{o.name}</p><p className="text-gray-500 text-xs">{o.slug}.threatcast.io</p></div>
              <div className="flex items-center gap-3 text-xs text-gray-400"><span>{o._count.users} users</span><span>{o._count.ttxSessions} sessions</span><span className="cyber-badge bg-surface-3 text-gray-400">{o.plan}</span></div>
            </Link>
          ))}</div>
        </div>

        <div className="cyber-card">
          <div className="flex items-center justify-between mb-3"><h2 className="text-white text-sm font-semibold">Recent Sessions</h2><Link href="/admin/sessions" className="text-cyber-400 text-xs">View All →</Link></div>
          <div className="space-y-2">{recentSessions.map(s => (
            <div key={s.id} className="flex items-center justify-between py-2 border-b border-surface-3/50 last:border-0">
              <div className="min-w-0 mr-3"><p className="text-white text-sm truncate">{s.title}</p><p className="text-gray-500 text-xs">{s.organization?.name}</p></div>
              <div className="flex items-center gap-2"><span className="text-gray-400 text-xs">{s._count.participants} players</span><span className={`cyber-badge text-xs ${sc[s.status] || "bg-surface-3 text-gray-400"}`}>{s.status}</span></div>
            </div>
          ))}</div>
        </div>
      </div>
    </div>
  );
}
