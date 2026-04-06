import { db } from "@/lib/db";
import Link from "next/link";
export const dynamic = "force-dynamic";

const PLAN_PRICES: Record<string, number> = { FREE: 0, STARTER: 149, GROWTH: 299, PROFESSIONAL: 599, ENTERPRISE: 1499 };

export default async function AdminDashboard() {
  const [orgCount, userCount, sessionCount, completedCount, liveCount, cancelledCount, generatingCount, pendingInvites] = await Promise.all([
    db.organization.count({ where: { slug: { not: "__platform__" } } }),
    db.user.count({ where: { clerkId: { startsWith: "hash:" } } }),
    db.ttxSession.count(),
    db.ttxSession.count({ where: { status: "COMPLETED" } }),
    db.ttxSession.count({ where: { status: "IN_PROGRESS" } }),
    db.ttxSession.count({ where: { status: "CANCELLED" } }),
    db.ttxSession.count({ where: { status: "GENERATING" } }),
    db.user.count({ where: { clerkId: { startsWith: "pending_" } } }),
  ]);

  const orgs = await db.organization.findMany({
    include: { _count: { select: { users: true, ttxSessions: true } }, profile: { select: { industry: true } }, securityTools: { select: { toolId: true } } },
  });

  const mrr = orgs.reduce((sum, o) => sum + (PLAN_PRICES[o.plan] || 0), 0);
  const recentSignups = await db.user.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 86400000) }, clerkId: { startsWith: "hash:" } } });
  const allAnswers = await db.ttxAnswer.count();
  const correctAnswers = await db.ttxAnswer.count({ where: { isCorrect: true } });
  const platformAccuracy = allAnswers > 0 ? Math.round((correctAnswers / allAnswers) * 100) : 0;

  // Usage alerts
  const alerts: { level: string; message: string; client: string; href: string }[] = [];
  orgs.forEach(o => {
    const usage = o.maxTtxPerMonth > 0 && o.maxTtxPerMonth < 9999 ? o.ttxUsedThisMonth / o.maxTtxPerMonth : 0;
    if (usage >= 0.8) alerts.push({ level: usage >= 1 ? "critical" : "warning", message: `${Math.round(usage * 100)}% exercise limit (${o.ttxUsedThisMonth}/${o.maxTtxPerMonth})`, client: o.name, href: `/admin/clients/${o.id}` });
    if (o._count.users >= o.maxUsers * 0.9 && o.maxUsers < 9999) alerts.push({ level: "warning", message: `${o._count.users}/${o.maxUsers} user seats`, client: o.name, href: `/admin/clients/${o.id}` });
  });
  if (generatingCount > 0) alerts.push({ level: "warning", message: `${generatingCount} stuck generating`, client: "System", href: "/admin/sessions" });

  // Client onboarding funnel
  const onboardingFunnel = orgs.filter(o => !o.isDemo).map(o => ({
    name: o.name, id: o.id, plan: o.plan,
    hasProfile: !!(o.profile as any)?.industry,
    hasTools: o.securityTools.length > 0,
    hasUsers: o._count.users > 0,
    hasExercise: o._count.ttxSessions > 0,
  }));
  const funnelComplete = onboardingFunnel.filter(o => o.hasProfile && o.hasTools && o.hasUsers && o.hasExercise).length;
  const funnelPartial = onboardingFunnel.filter(o => (o.hasProfile || o.hasTools || o.hasUsers || o.hasExercise) && !(o.hasProfile && o.hasTools && o.hasUsers && o.hasExercise)).length;
  const funnelEmpty = onboardingFunnel.filter(o => !o.hasProfile && !o.hasTools && !o.hasUsers && !o.hasExercise).length;

  const recentSessions = await db.ttxSession.findMany({
    take: 8, orderBy: { createdAt: "desc" },
    include: { organization: { select: { name: true } }, _count: { select: { participants: true } } },
  });

  const sc: Record<string, string> = { COMPLETED: "bg-green-500/20 text-green-400", IN_PROGRESS: "bg-blue-500/20 text-blue-400", CANCELLED: "bg-red-500/20 text-red-400", GENERATING: "bg-yellow-500/20 text-yellow-400", LOBBY: "bg-purple-500/20 text-purple-400" };
  const ac: Record<string, string> = { critical: "border-l-red-500 bg-red-500/5", warning: "border-l-yellow-500 bg-yellow-500/5" };

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl sm:text-2xl font-bold text-white">Admin Dashboard</h1><p className="text-gray-500 text-xs mt-1">ThreatCast Platform Overview</p></div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-4">
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-green-400">£{mrr.toLocaleString()}</p><p className="text-gray-500 text-xs">MRR</p></div>
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-white">{orgCount}</p><p className="text-gray-500 text-xs">Portals</p></div>
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-cyan-400">{userCount}</p><p className="text-gray-500 text-xs">Users</p></div>
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-cyber-400">{sessionCount}</p><p className="text-gray-500 text-xs">Exercises</p></div>
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-blue-400">{platformAccuracy}%</p><p className="text-gray-500 text-xs">Accuracy</p></div>
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-purple-400">{recentSignups}</p><p className="text-gray-500 text-xs">Signups (7d)</p></div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="cyber-card mb-4 border-yellow-500/20">
          <h2 className="text-yellow-400 text-xs font-semibold mb-2">⚠ Alerts ({alerts.length})</h2>
          <div className="space-y-1">{alerts.map((a, i) => (
            <Link key={i} href={a.href} className={`block border-l-2 pl-3 py-1.5 rounded-r ${ac[a.level]}`}>
              <span className="text-white text-xs font-medium">{a.client}</span>
              <span className="text-gray-400 text-xs ml-2">{a.message}</span>
            </Link>
          ))}</div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        {/* Client Onboarding Funnel */}
        <div className="cyber-card">
          <h2 className="text-white text-sm font-semibold mb-3">Client Onboarding Funnel</h2>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="text-center p-2 rounded bg-green-500/10 border border-green-500/20"><p className="font-display text-xl font-bold text-green-400">{funnelComplete}</p><p className="text-gray-500 text-xs">Fully Setup</p></div>
            <div className="text-center p-2 rounded bg-yellow-500/10 border border-yellow-500/20"><p className="font-display text-xl font-bold text-yellow-400">{funnelPartial}</p><p className="text-gray-500 text-xs">Partial</p></div>
            <div className="text-center p-2 rounded bg-red-500/10 border border-red-500/20"><p className="font-display text-xl font-bold text-red-400">{funnelEmpty}</p><p className="text-gray-500 text-xs">Not Started</p></div>
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">{onboardingFunnel.filter(o => !(o.hasProfile && o.hasTools && o.hasUsers && o.hasExercise)).slice(0, 8).map(o => (
            <Link key={o.id} href={`/admin/clients/${o.id}`} className="flex items-center justify-between py-1.5 border-b border-surface-3/30 last:border-0 hover:bg-surface-2/50 rounded px-1">
              <span className="text-white text-xs">{o.name}</span>
              <div className="flex gap-1">{[
                { done: o.hasProfile, label: "P" }, { done: o.hasTools, label: "T" },
                { done: o.hasUsers, label: "U" }, { done: o.hasExercise, label: "E" },
              ].map(s => <span key={s.label} className={`text-xs w-5 h-5 rounded flex items-center justify-center ${s.done ? "bg-green-500/20 text-green-400" : "bg-surface-3 text-gray-600"}`}>{s.label}</span>)}</div>
            </Link>
          ))}</div>
        </div>

        {/* Recent Sessions */}
        <div className="cyber-card">
          <div className="flex items-center justify-between mb-3"><h2 className="text-white text-sm font-semibold">Recent Exercises</h2><Link href="/admin/sessions" className="text-gray-500 text-xs hover:text-gray-300">View all →</Link></div>
          <div className="space-y-1.5">{recentSessions.map(s => (
            <div key={s.id} className="flex items-center justify-between py-1.5 border-b border-surface-3/30 last:border-0">
              <div className="min-w-0 mr-2"><p className="text-white text-xs truncate">{s.title || s.theme}</p><p className="text-gray-600 text-xs">{s.organization?.name} · {s._count.participants} players</p></div>
              <span className={`cyber-badge text-xs flex-shrink-0 ${sc[s.status] || "bg-surface-3 text-gray-400"}`}>{s.status}</span>
            </div>
          ))}</div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Link href="/admin/clients" className="cyber-card hover:border-cyber-600/30 transition-colors text-center"><span className="text-2xl">🏢</span><p className="text-white text-sm mt-2">Client Portals</p><p className="text-gray-500 text-xs">{orgCount} portals</p></Link>
        <Link href="/admin/users" className="cyber-card hover:border-cyber-600/30 transition-colors text-center"><span className="text-2xl">👥</span><p className="text-white text-sm mt-2">Users</p><p className="text-gray-500 text-xs">{userCount} active · {pendingInvites} pending</p></Link>
        <Link href="/admin/analytics" className="cyber-card hover:border-cyber-600/30 transition-colors text-center"><span className="text-2xl">📈</span><p className="text-white text-sm mt-2">Analytics</p><p className="text-gray-500 text-xs">{completedCount} completed</p></Link>
        <Link href="/admin/billing" className="cyber-card hover:border-cyber-600/30 transition-colors text-center"><span className="text-2xl">💰</span><p className="text-white text-sm mt-2">Billing</p><p className="text-gray-500 text-xs">£{(mrr * 12).toLocaleString()} ARR</p></Link>
      </div>
    </div>
  );
}
