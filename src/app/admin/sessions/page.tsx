import { db } from "@/lib/db";
import Link from "next/link";
import { deleteSession, bulkDeleteSessions } from "../actions";
export const dynamic = "force-dynamic";

export default async function SessionsPage() {
  const sessions = await db.ttxSession.findMany({
    orderBy: { createdAt: "desc" }, take: 100,
    include: {
      organization: { select: { name: true } },
      createdBy: { select: { firstName: true, email: true } },
      participants: { include: { answers: { select: { isCorrect: true } }, user: { select: { firstName: true, lastName: true } } } },
      _count: { select: { participants: true } },
    },
  });

  const statusCounts = sessions.reduce((a, s) => { a[s.status] = (a[s.status] || 0) + 1; return a; }, {} as Record<string, number>);
  const sc: Record<string, string> = { COMPLETED: "bg-green-500/20 text-green-400", IN_PROGRESS: "bg-blue-500/20 text-blue-400", CANCELLED: "bg-red-500/20 text-red-400", GENERATING: "bg-yellow-500/20 text-yellow-400", LOBBY: "bg-purple-500/20 text-purple-400" };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div><h1 className="font-display text-xl sm:text-2xl font-bold text-white">All Sessions</h1><p className="text-gray-500 text-xs mt-1">{sessions.length} sessions</p></div>
        <div className="flex gap-2">
          {(statusCounts["CANCELLED"] || 0) > 0 && (
            <form action={async () => { "use server"; await bulkDeleteSessions("CANCELLED"); }}><button type="submit" className="cyber-btn-danger text-xs">Delete {statusCounts["CANCELLED"]} Cancelled</button></form>
          )}
          {(statusCounts["GENERATING"] || 0) > 0 && (
            <form action={async () => { "use server"; await bulkDeleteSessions("GENERATING"); }}><button type="submit" className="cyber-btn-danger text-xs">Delete {statusCounts["GENERATING"]} Stuck</button></form>
          )}
        </div>
      </div>

      {/* Status summary */}
      <div className="flex gap-2 mb-4 flex-wrap">{Object.entries(statusCounts).map(([s, c]) => (
        <span key={s} className={`cyber-badge text-xs ${sc[s] || "bg-surface-3 text-gray-400"}`}>{s}: {c}</span>
      ))}</div>

      <div className="space-y-2">{sessions.map(s => {
        const answers = s.participants.flatMap(p => p.answers);
        const correct = answers.filter(a => a.isCorrect).length;
        const accuracy = answers.length > 0 ? Math.round((correct / answers.length) * 100) : null;
        const players = s.participants.map(p => `${p.user.firstName || ""} ${p.user.lastName || ""}`.trim()).filter(Boolean);

        return (
          <div key={s.id} className="cyber-card">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`cyber-badge text-xs ${sc[s.status] || "bg-surface-3 text-gray-400"}`}>{s.status}</span>
                  <span className="text-gray-500 text-xs">{s.organization?.name}</span>
                  <span className="text-gray-600 text-xs">{new Date(s.createdAt).toLocaleDateString("en-GB")} {new Date(s.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <p className="text-white text-sm font-medium">{s.title || s.theme}</p>
                <p className="text-gray-500 text-xs mt-0.5">{s.theme} · {s.difficulty} · {s._count.participants} players{accuracy !== null ? ` · ${accuracy}% accuracy` : ""}</p>
                {players.length > 0 && <p className="text-gray-600 text-xs mt-0.5">Players: {players.join(", ")}</p>}
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                {s.status === "COMPLETED" && <Link href={`/portal/ttx/${s.id}/replay`} className="cyber-btn-secondary text-xs py-1 px-2">Replay</Link>}
                <form action={async () => { "use server"; await deleteSession(s.id); }}><button type="submit" className="cyber-btn-danger text-xs py-1 px-2">Delete</button></form>
              </div>
            </div>
          </div>
        );
      })}</div>
    </div>
  );
}
