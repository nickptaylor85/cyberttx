import { db } from "@/lib/db";
export const dynamic = "force-dynamic";

export default async function AuditPage() {
  // Get recent user activity as an audit log
  const recentUsers = await db.user.findMany({
    orderBy: { updatedAt: "desc" }, take: 50,
    include: { organization: { select: { name: true } } },
  });
  const recentSessions = await db.ttxSession.findMany({
    orderBy: { createdAt: "desc" }, take: 30,
    include: { organization: { select: { name: true } }, createdBy: { select: { firstName: true, email: true } } },
  });

  // Combine into audit events
  const events = [
    ...recentUsers.map(u => ({
      time: u.updatedAt, type: u.clerkId.startsWith("pending_") ? "INVITATION" : "USER_UPDATE",
      user: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email,
      client: u.organization?.name || "—", detail: `${u.role} · ${u.email}`,
      color: u.clerkId.startsWith("pending_") ? "border-l-yellow-500" : "border-l-blue-500",
    })),
    ...recentSessions.map(s => ({
      time: s.createdAt, type: s.status === "COMPLETED" ? "EXERCISE_COMPLETE" : "EXERCISE_CREATED",
      user: s.createdBy?.firstName || s.createdBy?.email || "System",
      client: s.organization?.name || "—", detail: `${s.title} · ${s.theme}`,
      color: s.status === "COMPLETED" ? "border-l-green-500" : "border-l-cyan-500",
    })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 50);

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl sm:text-2xl font-bold text-white">Audit Log</h1><p className="text-gray-500 text-xs mt-1">Recent platform activity</p></div>
      {events.length === 0 ? <div className="cyber-card text-center py-8"><p className="text-gray-500 text-sm">No activity yet</p></div> :
        <div className="space-y-1.5">{events.map((e, i) => (
          <div key={i} className={`cyber-card border-l-4 ${e.color} py-2`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-gray-600 text-xs font-mono flex-shrink-0 w-14">{new Date(e.time).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
                <span className="cyber-badge text-xs bg-surface-3 text-gray-400 flex-shrink-0">{e.type.replace(/_/g, " ")}</span>
                <span className="text-white text-xs truncate">{e.user}</span>
                <span className="text-purple-400 text-xs flex-shrink-0">{e.client}</span>
              </div>
              <span className="text-gray-500 text-xs truncate ml-2 max-w-[200px]">{e.detail}</span>
            </div>
          </div>
        ))}</div>
      }
    </div>
  );
}
