import { db } from "@/lib/db";
export const dynamic = "force-dynamic";

export default async function AuditPage() {
  // Build audit trail from DB events
  const [sessions, users, orgs] = await Promise.all([
    db.ttxSession.findMany({ orderBy: { createdAt: "desc" }, take: 30, select: { id: true, title: true, theme: true, status: true, createdAt: true, createdById: true, organization: { select: { name: true } }, createdBy: { select: { firstName: true, lastName: true, email: true } } } }),
    db.user.findMany({ orderBy: { createdAt: "desc" }, take: 20, select: { firstName: true, lastName: true, email: true, role: true, createdAt: true, organization: { select: { name: true } } } }),
    db.organization.findMany({ where: { slug: { not: "__platform__" } }, orderBy: { createdAt: "desc" }, take: 10, select: { name: true, slug: true, plan: true, createdAt: true } }),
  ]);

  const events: { action: string; actor: string; target: string; org: string; time: Date; icon: string }[] = [];

  sessions.forEach(s => {
    events.push({ action: s.status === "COMPLETED" ? "exercise.completed" : s.status === "CANCELLED" ? "exercise.failed" : "exercise.created", actor: s.createdBy ? `${s.createdBy.firstName} ${s.createdBy.lastName}` : "System", target: s.title || s.theme || s.id, org: s.organization?.name || "—", time: s.createdAt, icon: s.status === "COMPLETED" ? "✅" : "🎯" });
  });

  users.forEach(u => {
    events.push({ action: "user.registered", actor: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email, target: u.email, org: u.organization?.name || "—", time: u.createdAt, icon: "👤" });
  });

  orgs.forEach(o => {
    events.push({ action: "org.created", actor: "Admin", target: `${o.name} (${o.slug})`, org: o.name, time: o.createdAt, icon: "🏢" });
  });

  events.sort((a, b) => b.time.getTime() - a.time.getTime());

  const ac: Record<string, string> = { "exercise.completed": "bg-green-500/20 text-green-400", "exercise.created": "bg-blue-500/20 text-blue-400", "exercise.failed": "bg-red-500/20 text-red-400", "user.registered": "bg-purple-500/20 text-purple-400", "org.created": "bg-yellow-500/20 text-yellow-400" };

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl font-bold text-white">Audit Log</h1><p className="text-gray-500 text-xs mt-1">{events.length} events</p></div>
      <div className="cyber-card overflow-x-auto">
        <table className="w-full text-xs">
          <thead><tr className="border-b border-surface-3"><th className="text-left py-2 text-gray-500 font-normal">Time</th><th className="text-left py-2 text-gray-500 font-normal">Action</th><th className="text-left py-2 text-gray-500 font-normal">Actor</th><th className="text-left py-2 text-gray-500 font-normal">Target</th><th className="text-left py-2 text-gray-500 font-normal">Portal</th></tr></thead>
          <tbody>{events.map((e, i) => (
            <tr key={i} className="border-b border-surface-3/30 last:border-0">
              <td className="py-2 text-gray-500 whitespace-nowrap">{new Date(e.time).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</td>
              <td className="py-2"><span className={`cyber-badge text-xs ${ac[e.action] || "bg-surface-3 text-gray-400"}`}>{e.icon} {e.action}</span></td>
              <td className="py-2 text-white">{e.actor}</td>
              <td className="py-2 text-gray-400 max-w-48 truncate">{e.target}</td>
              <td className="py-2 text-gray-500">{e.org}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
