import { db } from "@/lib/db";
export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const [sessions, users, orgs] = await Promise.all([
    db.ttxSession.findMany({ take: 20, orderBy: { createdAt: "desc" }, select: { id: true, title: true, status: true, createdAt: true, completedAt: true, theme: true, organization: { select: { name: true } }, createdBy: { select: { firstName: true, email: true } } } }),
    db.user.findMany({ take: 15, orderBy: { createdAt: "desc" }, select: { firstName: true, lastName: true, email: true, role: true, createdAt: true, organization: { select: { name: true } } } }),
    db.organization.findMany({ take: 10, orderBy: { createdAt: "desc" }, select: { name: true, slug: true, plan: true, createdAt: true } }),
  ]);
  type Ev = { time: Date; icon: string; title: string; detail: string; type: string };
  const events: Ev[] = [];
  sessions.forEach(s => { events.push({ time: s.createdAt, icon: "🎯", title: `Exercise: ${s.title}`, detail: `${s.organization.name} · ${s.createdBy.firstName || s.createdBy.email}`, type: "session" }); if (s.completedAt) events.push({ time: s.completedAt, icon: "✅", title: `Completed: ${s.title}`, detail: s.organization.name, type: "completed" }); });
  users.forEach(u => events.push({ time: u.createdAt, icon: "👤", title: `User: ${u.firstName || ""} ${u.lastName || ""} (${u.email})`, detail: `${u.organization?.name || "No org"} · ${u.role}`, type: "user" }));
  orgs.forEach(o => events.push({ time: o.createdAt, icon: "🏢", title: `Portal: ${o.name}`, detail: `${o.slug}.threatcast.io · ${o.plan}`, type: "org" }));
  events.sort((a, b) => b.time.getTime() - a.time.getTime());
  const colors: Record<string, string> = { session: "border-blue-500/30", completed: "border-green-500/30", user: "border-purple-500/30", org: "border-cyber-500/30" };
  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl sm:text-2xl font-bold text-white">Audit Log</h1><p className="text-gray-500 text-xs sm:text-sm mt-1">Platform activity timeline</p></div>
      <div className="space-y-2">{events.slice(0, 40).map((e, i) => (
        <div key={i} className={`cyber-card flex items-start gap-3 border-l-2 ${colors[e.type] || "border-surface-3"}`}>
          <span className="text-lg mt-0.5">{e.icon}</span>
          <div className="flex-1 min-w-0"><p className="text-white text-sm">{e.title}</p><p className="text-gray-500 text-xs">{e.detail}</p></div>
          <span className="text-gray-600 text-xs whitespace-nowrap">{e.time.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
        </div>
      ))}</div>
    </div>
  );
}
