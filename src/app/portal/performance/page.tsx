import { db } from "@/lib/db";
import { headers } from "next/headers";
export const dynamic = "force-dynamic";

export default async function PerformancePage() {
  const h = await headers(); const slug = h.get("x-org-slug") || "demo";
  const org = await db.organization.findUnique({ where: { slug } });
  if (!org) return <p className="text-red-400">Org not found</p>;
  const participants = await db.ttxParticipant.findMany({
    where: { session: { orgId: org.id, status: "COMPLETED" } },
    include: { user: { select: { firstName: true, lastName: true, email: true } }, answers: true, session: { select: { createdAt: true, title: true } } },
    orderBy: { session: { createdAt: "desc" } }, take: 100,
  });
  // Group by user
  const userMap = new Map<string, { name: string; sessions: { title: string; date: Date; correct: number; total: number; score: number }[] }>();
  participants.forEach(p => {
    const key = p.userId;
    if (!userMap.has(key)) userMap.set(key, { name: `${p.user.firstName || ""} ${p.user.lastName || ""}`.trim() || p.user.email, sessions: [] });
    const correct = p.answers.filter(a => a.isCorrect).length;
    userMap.get(key)!.sessions.push({ title: p.session.title, date: p.session.createdAt, correct, total: p.answers.length, score: p.totalScore });
  });
  const users = Array.from(userMap.entries()).map(([id, data]) => {
    const avgAcc = data.sessions.length > 0 ? Math.round(data.sessions.reduce((s, x) => s + (x.total > 0 ? (x.correct / x.total) * 100 : 0), 0) / data.sessions.length) : 0;
    return { id, ...data, avgAcc };
  }).sort((a, b) => b.avgAcc - a.avgAcc);

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl sm:text-2xl font-bold text-white">Team Performance</h1><p className="text-gray-500 text-xs sm:text-sm mt-1">Individual accuracy across exercises</p></div>
      {users.length === 0 ? <div className="cyber-card text-center py-12"><p className="text-gray-400">No completed exercises yet</p></div> :
      <div className="space-y-3">{users.map(u => (
        <div key={u.id} className="cyber-card">
          <div className="flex items-center justify-between mb-2"><p className="text-white text-sm font-medium">{u.name}</p><span className="text-cyber-400 font-mono text-sm">{u.avgAcc}% avg</span></div>
          <div className="h-1.5 bg-surface-3 rounded-full mb-2"><div className={`h-full rounded-full ${u.avgAcc >= 70 ? "bg-green-500" : u.avgAcc >= 40 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${u.avgAcc}%` }} /></div>
          <p className="text-gray-500 text-xs">{u.sessions.length} exercises completed</p>
        </div>
      ))}</div>}
    </div>
  );
}
