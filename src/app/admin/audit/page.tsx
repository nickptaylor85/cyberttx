import { db } from "@/lib/db";
export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const [sessions, users, orgs] = await Promise.all([
    db.ttxSession.findMany({
      take: 30, orderBy: { createdAt: "desc" },
      select: { id: true, title: true, status: true, createdAt: true, completedAt: true, theme: true,
        organization: { select: { name: true, slug: true } },
        createdBy: { select: { firstName: true, lastName: true, email: true } }
      },
    }),
    db.user.findMany({
      take: 20, orderBy: { createdAt: "desc" },
      select: { firstName: true, lastName: true, email: true, role: true, createdAt: true,
        organization: { select: { name: true } }
      },
    }),
    db.organization.findMany({
      take: 15, orderBy: { createdAt: "desc" },
      select: { name: true, slug: true, plan: true, createdAt: true, _count: { select: { users: true, ttxSessions: true } } },
    }),
  ]);

  type Ev = { time: Date; icon: string; title: string; client: string; user: string; detail: string; type: string };
  const events: Ev[] = [];

  sessions.forEach(s => {
    const client = s.organization?.name || "Unknown";
    const user = s.createdBy ? `${s.createdBy.firstName || ""} ${s.createdBy.lastName || ""}`.trim() || s.createdBy.email : "System";
    events.push({ time: new Date(s.createdAt), icon: "🎯", title: `Exercise: ${s.title}`, client, user, detail: `${s.theme} · ${s.status}`, type: "exercise" });
    if (s.completedAt) events.push({ time: new Date(s.completedAt), icon: "✅", title: `Completed: ${s.title}`, client, user, detail: s.status, type: "complete" });
  });
  users.forEach(u => {
    const name = `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email;
    events.push({ time: new Date(u.createdAt), icon: "👤", title: `User joined: ${name}`, client: u.organization?.name || "No org", user: name, detail: u.role, type: "user" });
  });
  orgs.forEach(o => {
    events.push({ time: new Date(o.createdAt), icon: "🏢", title: `Portal created: ${o.name}`, client: o.name, user: "Admin", detail: `${o.plan} · ${o._count.users} users · ${o._count.ttxSessions} sessions`, type: "org" });
  });

  events.sort((a, b) => b.time.getTime() - a.time.getTime());
  const tc: Record<string, string> = { exercise: "border-l-blue-500", complete: "border-l-green-500", user: "border-l-purple-500", org: "border-l-cyan-500" };

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl sm:text-2xl font-bold text-white">Audit Log</h1><p className="text-gray-500 text-xs sm:text-sm mt-1">{events.length} events</p></div>

      <div className="space-y-2">{events.slice(0, 50).map((e, i) => (
        <div key={i} className={`cyber-card border-l-4 ${tc[e.type] || "border-l-gray-500"}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <span className="text-lg flex-shrink-0 mt-0.5">{e.icon}</span>
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">{e.title}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-xs"><span className="text-gray-600">Client:</span><span className="text-cyber-400 font-medium">{e.client}</span></span>
                  <span className="text-gray-700">·</span>
                  <span className="inline-flex items-center gap-1 text-xs"><span className="text-gray-600">User:</span><span className="text-purple-400 font-medium">{e.user}</span></span>
                  <span className="text-gray-700">·</span>
                  <span className="text-gray-500 text-xs">{e.detail}</span>
                </div>
              </div>
            </div>
            <span className="text-gray-600 text-xs whitespace-nowrap flex-shrink-0">{e.time.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })} {e.time.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        </div>
      ))}</div>
    </div>
  );
}
