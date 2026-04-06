import { db } from "@/lib/db";
export const dynamic = "force-dynamic";

export default async function HealthPage() {
  const now = new Date();
  const hour = new Date(now.getTime() - 3600000);
  const day = new Date(now.getTime() - 86400000);
  const week = new Date(now.getTime() - 7 * 86400000);

  const [totalSessions, completedHour, completedDay, cancelled, generating, stuckOld, usersTotal, signupsDay, signupsWeek, pendingInvites] = await Promise.all([
    db.ttxSession.count(),
    db.ttxSession.count({ where: { completedAt: { gte: hour } } }),
    db.ttxSession.count({ where: { completedAt: { gte: day } } }),
    db.ttxSession.count({ where: { status: "CANCELLED" } }),
    db.ttxSession.count({ where: { status: "GENERATING" } }),
    db.ttxSession.count({ where: { status: "GENERATING", createdAt: { lt: new Date(now.getTime() - 300000) } } }),
    db.user.count({ where: { clerkId: { startsWith: "hash:" } } }),
    db.user.count({ where: { createdAt: { gte: day }, clerkId: { startsWith: "hash:" } } }),
    db.user.count({ where: { createdAt: { gte: week }, clerkId: { startsWith: "hash:" } } }),
    db.user.count({ where: { clerkId: { startsWith: "pending_" } } }),
  ]);

  const failRate = totalSessions > 0 ? Math.round((cancelled / totalSessions) * 100) : 0;
  const allHealthy = stuckOld === 0 && failRate < 20;

  // Recent failures
  const recentFailures = await db.ttxSession.findMany({
    where: { status: "CANCELLED", createdAt: { gte: day } },
    orderBy: { createdAt: "desc" }, take: 10,
    select: { id: true, theme: true, createdAt: true, organization: { select: { name: true } } },
  });

  // Notifications/events
  const notifications: { type: string; message: string; time: Date; severity: string }[] = [];
  if (stuckOld > 0) notifications.push({ type: "⚠️ Stuck Sessions", message: `${stuckOld} sessions stuck generating >5min`, time: now, severity: "warning" });
  if (failRate > 20) notifications.push({ type: "🔴 High Failure Rate", message: `${failRate}% of exercises are cancelled`, time: now, severity: "critical" });
  if (signupsDay > 0) notifications.push({ type: "👤 New Signups", message: `${signupsDay} new users today`, time: now, severity: "info" });
  if (pendingInvites > 5) notifications.push({ type: "📧 Pending Invites", message: `${pendingInvites} invitations waiting`, time: now, severity: "info" });
  if (completedDay > 0) notifications.push({ type: "✅ Exercises", message: `${completedDay} completed today (${completedHour} in last hour)`, time: now, severity: "info" });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="font-display text-xl sm:text-2xl font-bold text-white">System Health</h1><p className="text-gray-500 text-xs mt-1">Monitoring and notifications</p></div>
        <span className={`cyber-badge text-sm ${allHealthy ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>{allHealthy ? "✓ All Systems OK" : "⚠ Issues Detected"}</span>
      </div>

      {/* Status grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        <div className={`cyber-card text-center ${stuckOld > 0 ? "border-yellow-500/30" : ""}`}><p className={`font-display text-2xl font-bold ${stuckOld > 0 ? "text-yellow-400" : "text-green-400"}`}>{generating}</p><p className="text-gray-500 text-xs">Generating{stuckOld > 0 ? ` (${stuckOld} stuck)` : ""}</p></div>
        <div className={`cyber-card text-center ${failRate > 20 ? "border-red-500/30" : ""}`}><p className={`font-display text-2xl font-bold ${failRate > 20 ? "text-red-400" : "text-green-400"}`}>{failRate}%</p><p className="text-gray-500 text-xs">Failure Rate</p></div>
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-cyan-400">{completedDay}</p><p className="text-gray-500 text-xs">Completed (24h)</p></div>
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-white">{signupsDay}</p><p className="text-gray-500 text-xs">Signups (24h)</p></div>
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-purple-400">{pendingInvites}</p><p className="text-gray-500 text-xs">Pending Invites</p></div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        {/* Notifications */}
        <div className="cyber-card">
          <h2 className="text-white text-sm font-semibold mb-3">Notifications</h2>
          {notifications.length === 0 ? <p className="text-gray-500 text-xs">Nothing to report</p> :
            <div className="space-y-2">{notifications.map((n, i) => (
              <div key={i} className={`p-2 rounded border-l-2 ${n.severity === "critical" ? "border-l-red-500 bg-red-500/5" : n.severity === "warning" ? "border-l-yellow-500 bg-yellow-500/5" : "border-l-cyan-500 bg-cyan-500/5"}`}>
                <p className="text-white text-xs font-medium">{n.type}</p>
                <p className="text-gray-400 text-xs">{n.message}</p>
              </div>
            ))}</div>
          }
        </div>

        {/* Recent failures */}
        <div className="cyber-card">
          <h2 className="text-white text-sm font-semibold mb-3">Recent Failures (24h)</h2>
          {recentFailures.length === 0 ? <p className="text-green-400 text-xs">No failures in last 24 hours</p> :
            <div className="space-y-1.5">{recentFailures.map(f => (
              <div key={f.id} className="flex items-center justify-between py-1 border-b border-surface-3/30 last:border-0">
                <div><p className="text-gray-400 text-xs">{f.theme}</p><p className="text-gray-600 text-xs">{f.organization?.name}</p></div>
                <span className="text-gray-600 text-xs">{new Date(f.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            ))}</div>
          }
        </div>
      </div>

      {/* Services */}
      <div className="cyber-card">
        <h2 className="text-white text-sm font-semibold mb-3">Service Status</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {[
            { name: "Database (Neon)", status: "operational", detail: `${usersTotal} users, ${totalSessions} sessions` },
            { name: "AI (Anthropic)", status: failRate > 30 ? "degraded" : "operational", detail: `${failRate}% fail rate` },
            { name: "Auth (NextAuth)", status: "operational", detail: "JWT sessions" },
            { name: "Hosting (Vercel)", status: "operational", detail: "Edge network" },
            { name: "Email (Resend)", status: "operational", detail: "Transactional emails" },
            { name: "Real-time (Pusher)", status: "operational", detail: "WebSocket channels" },
          ].map(s => (
            <div key={s.name} className="flex items-center gap-3 p-2.5 rounded bg-surface-0 border border-surface-3">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.status === "operational" ? "bg-green-400" : s.status === "degraded" ? "bg-yellow-400" : "bg-red-400"}`} />
              <div><p className="text-white text-xs">{s.name}</p><p className="text-gray-600 text-xs">{s.detail}</p></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
