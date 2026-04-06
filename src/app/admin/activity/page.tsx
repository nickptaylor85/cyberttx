import { db } from "@/lib/db";
export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const recentSessions = await db.ttxSession.findMany({
    orderBy: { createdAt: "desc" }, take: 30,
    include: { organization: { select: { name: true } }, createdBy: { select: { firstName: true, lastName: true } } },
  });
  const recentUsers = await db.user.findMany({
    orderBy: { createdAt: "desc" }, take: 10, where: { clerkId: { startsWith: "hash:" } },
    select: { firstName: true, lastName: true, email: true, createdAt: true, organization: { select: { name: true } } },
  });

  const activities: { type: string; title: string; detail: string; time: Date; icon: string }[] = [];
  recentSessions.forEach(s => {
    activities.push({ type: "exercise", title: s.status === "COMPLETED" ? "Exercise completed" : s.status === "GENERATING" ? "Exercise generating" : `Exercise ${s.status.toLowerCase()}`, detail: `${s.title || s.theme} — ${s.organization?.name || "Unknown"} (by ${s.createdBy?.firstName || "System"})`, time: s.createdAt, icon: s.status === "COMPLETED" ? "✅" : "🎯" });
  });
  recentUsers.forEach(u => {
    activities.push({ type: "user", title: "New user registered", detail: `${u.firstName} ${u.lastName} (${u.email}) — ${u.organization?.name || ""}`, time: u.createdAt, icon: "👤" });
  });
  activities.sort((a, b) => b.time.getTime() - a.time.getTime());

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl font-bold text-white">Activity Feed</h1><p className="text-gray-500 text-xs mt-1">Real-time platform activity</p></div>
      <div className="space-y-1">{activities.slice(0, 50).map((a, i) => (
        <div key={i} className="cyber-card py-2.5 flex items-start gap-3">
          <span className="text-base flex-shrink-0">{a.icon}</span>
          <div className="min-w-0 flex-1"><p className="text-white text-xs font-medium">{a.title}</p><p className="text-gray-500 text-xs truncate">{a.detail}</p></div>
          <span className="text-gray-600 text-xs flex-shrink-0">{new Date(a.time).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
        </div>
      ))}</div>
    </div>
  );
}
