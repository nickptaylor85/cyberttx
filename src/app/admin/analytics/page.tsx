import { db } from "@/lib/db";
export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const [total, completed, orgs] = await Promise.all([
    db.ttxSession.count(),
    db.ttxSession.count({ where: { status: "COMPLETED" } }),
    db.organization.findMany({ select: { name: true, _count: { select: { ttxSessions: true, users: true } } }, orderBy: { ttxSessions: { _count: "desc" } }, take: 10 }),
  ]);
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl sm:text-2xl font-bold text-white">Analytics</h1><p className="text-gray-500 text-xs sm:text-sm mt-1">Platform-wide metrics</p></div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-cyber-400">{total}</p><p className="text-gray-500 text-xs mt-1">Total Exercises</p></div>
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-green-400">{completed}</p><p className="text-gray-500 text-xs mt-1">Completed</p></div>
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-yellow-400">{completionRate}%</p><p className="text-gray-500 text-xs mt-1">Completion Rate</p></div>
      </div>
      <div className="cyber-card"><h2 className="font-display text-base font-semibold text-white mb-4">Top Clients by Usage</h2>
        <div className="space-y-2">{orgs.map(o => (
          <div key={o.name} className="flex items-center justify-between py-2 border-b border-surface-3/50 last:border-0">
            <p className="text-white text-sm">{o.name}</p>
            <div className="flex gap-4 text-xs text-gray-500"><span>{o._count.ttxSessions} exercises</span><span>{o._count.users} users</span></div>
          </div>
        ))}</div>
      </div>
    </div>
  );
}
