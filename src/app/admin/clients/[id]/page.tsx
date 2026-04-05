import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
export const dynamic = "force-dynamic";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const org = await db.organization.findUnique({
    where: { id },
    include: {
      users: { select: { id: true, firstName: true, lastName: true, email: true, role: true, createdAt: true, _count: { select: { participations: true } } } },
      ttxSessions: { take: 10, orderBy: { createdAt: "desc" }, select: { id: true, title: true, status: true, theme: true, createdAt: true, completedAt: true, _count: { select: { participants: true } } } },
      profile: true,
      securityTools: { include: { tool: true } },
    },
  });
  if (!org) notFound();

  const completed = org.ttxSessions.filter(s => s.status === "COMPLETED").length;
  const hasProfile = !!(org as any).profile?.industry;
  const hasTools = org.securityTools.length > 0;
  const hasUsers = org.users.length > 1;
  const hasExercise = org.ttxSessions.length > 0;
  const onboarding = [
    { label: "Company profile", done: hasProfile },
    { label: "Security stack configured", done: hasTools },
    { label: "Team members invited", done: hasUsers },
    { label: "First exercise run", done: hasExercise },
  ];
  const stepsComplete = onboarding.filter(s => s.done).length;

  const sc: Record<string, string> = { COMPLETED: "bg-green-500/20 text-green-400", IN_PROGRESS: "bg-blue-500/20 text-blue-400", CANCELLED: "bg-red-500/20 text-red-400", GENERATING: "bg-yellow-500/20 text-yellow-400", LOBBY: "bg-purple-500/20 text-purple-400" };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/admin/clients" className="text-gray-500 text-xs hover:text-gray-300 mb-1 inline-block">← Back to clients</Link>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-white">{org.name}</h1>
          <p className="text-gray-500 text-xs mt-1">{org.slug}.threatcast.io · {org.plan} · Created {new Date(org.createdAt).toLocaleDateString("en-GB")}</p>
        </div>
        <Link href={`/portal?org=${org.slug}`} className="cyber-btn-primary text-sm">View as Client →</Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-white">{org.users.length}</p><p className="text-gray-500 text-xs">Users</p></div>
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-cyber-400">{org.ttxSessions.length}</p><p className="text-gray-500 text-xs">Exercises</p></div>
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-green-400">{completed}</p><p className="text-gray-500 text-xs">Completed</p></div>
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-purple-400">{org.securityTools.length}</p><p className="text-gray-500 text-xs">Tools</p></div>
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-yellow-400">{org.ttxUsedThisMonth}/{org.maxTtxPerMonth}</p><p className="text-gray-500 text-xs">Used/Limit</p></div>
      </div>

      {/* Onboarding checklist */}
      <div className="cyber-card mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white text-sm font-semibold">Onboarding Progress</h2>
          <span className="text-cyber-400 text-sm font-mono">{stepsComplete}/4</span>
        </div>
        <div className="h-1.5 bg-surface-3 rounded-full mb-3"><div className="h-full bg-cyber-500 rounded-full" style={{ width: `${(stepsComplete / 4) * 100}%` }} /></div>
        <div className="grid grid-cols-2 gap-2">{onboarding.map(s => (
          <div key={s.label} className="flex items-center gap-2 text-xs"><span>{s.done ? "✅" : "⬜"}</span><span className={s.done ? "text-green-400" : "text-gray-500"}>{s.label}</span></div>
        ))}</div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Users */}
        <div className="cyber-card">
          <h2 className="text-white text-sm font-semibold mb-3">Team ({org.users.length})</h2>
          <div className="space-y-2">{org.users.map(u => (
            <div key={u.id} className="flex items-center justify-between py-1.5 border-b border-surface-3/50 last:border-0">
              <div><p className="text-white text-xs">{u.firstName} {u.lastName}</p><p className="text-gray-600 text-xs">{u.email}</p></div>
              <div className="flex items-center gap-2"><span className="text-gray-500 text-xs">{u._count.participations} ex</span><span className="cyber-badge text-xs bg-surface-3 text-gray-400">{u.role}</span></div>
            </div>
          ))}</div>
        </div>

        {/* Sessions */}
        <div className="cyber-card">
          <h2 className="text-white text-sm font-semibold mb-3">Recent Exercises ({org.ttxSessions.length})</h2>
          <div className="space-y-2">{org.ttxSessions.length === 0 ? <p className="text-gray-500 text-xs">No exercises yet</p> : org.ttxSessions.map(s => (
            <div key={s.id} className="flex items-center justify-between py-1.5 border-b border-surface-3/50 last:border-0">
              <div className="min-w-0 mr-2"><p className="text-white text-xs truncate">{s.title}</p><p className="text-gray-600 text-xs">{s.theme} · {s._count.participants} players</p></div>
              <span className={`cyber-badge text-xs flex-shrink-0 ${sc[s.status] || "bg-surface-3 text-gray-400"}`}>{s.status}</span>
            </div>
          ))}</div>
        </div>
      </div>

      {/* Security tools */}
      {org.securityTools.length > 0 && (
        <div className="cyber-card mt-4">
          <h2 className="text-white text-sm font-semibold mb-3">Security Stack</h2>
          <div className="flex flex-wrap gap-2">{org.securityTools.map(t => (
            <span key={t.toolId} className="cyber-badge text-xs bg-cyber-600/10 text-cyber-400 border border-cyber-600/20">{t.tool.name}</span>
          ))}</div>
        </div>
      )}
    </div>
  );
}
