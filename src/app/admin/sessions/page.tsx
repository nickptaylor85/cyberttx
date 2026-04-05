import { db } from "@/lib/db";
export const dynamic = "force-dynamic";

export default async function SessionsPage() {
  const sessions = await db.ttxSession.findMany({
    take: 50, orderBy: { createdAt: "desc" },
    include: { organization: { select: { name: true, slug: true } }, createdBy: { select: { firstName: true, lastName: true } }, _count: { select: { participants: true } } },
  });
  const stuck = sessions.filter(s => s.status === "GENERATING" && s.createdAt < new Date(Date.now() - 300000));
  return (
    <div>
      <div className="flex items-center justify-between mb-6"><div><h1 className="font-display text-xl sm:text-2xl font-bold text-white">All Sessions</h1><p className="text-gray-500 text-xs sm:text-sm mt-1">{sessions.length} exercises across all portals</p></div>
      {stuck.length > 0 && <span className="cyber-badge bg-red-500/20 text-red-400 border border-red-500/30 text-xs">{stuck.length} stuck</span>}</div>
      <div className="space-y-2">
        {sessions.map(s => (
          <div key={s.id} className="cyber-card flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="min-w-0"><p className="text-white text-sm font-medium truncate">{s.title}</p><p className="text-gray-500 text-xs">{s.organization.name} · {s.createdBy.firstName} {s.createdBy.lastName} · {s._count.participants} participants</p></div>
            <div className="flex items-center gap-2">
              <span className={`cyber-badge text-xs ${s.status === "COMPLETED" ? "bg-green-500/20 text-green-400" : s.status === "IN_PROGRESS" ? "bg-blue-500/20 text-blue-400" : s.status === "GENERATING" ? "bg-yellow-500/20 text-yellow-400" : "bg-surface-3 text-gray-400"}`}>{s.status}</span>
              <span className="text-gray-600 text-xs">{new Date(s.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
