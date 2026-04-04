import { db } from "@/lib/db";
import { headers } from "next/headers";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getOrg() {
  const headersList = await headers();
  const slug = headersList.get("x-org-slug") || "demo";
  return db.organization.findUnique({ where: { slug } });
}

export default async function TtxListPage() {
  const org = await getOrg();
  if (!org) return <p className="text-red-400">Organization not found</p>;

  const sessions = await db.ttxSession.findMany({
    where: { orgId: org.id, status: { not: "CANCELLED" } },
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { select: { firstName: true, lastName: true } },
      _count: { select: { participants: true } },
    },
  });

  const live = sessions.filter((s) => s.status === "IN_PROGRESS" || s.status === "LOBBY");
  const completed = sessions.filter((s) => s.status === "COMPLETED");
  const generating = sessions.filter((s) => s.status === "GENERATING");

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Exercises</h1>
          <p className="text-gray-500 text-sm mt-1">{sessions.length} total exercises</p>
        </div>
        <Link href="/portal/ttx/new" className="cyber-btn-primary">🎯 New Exercise</Link>
      </div>

      {/* Live Sessions */}
      {live.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Live Now
          </h2>
          <div className="space-y-2">
            {live.map((s) => (
              <Link key={s.id} href={`/portal/ttx/${s.id}`}
                className="cyber-card flex items-center justify-between border-green-500/20 hover:border-green-500/40 block">
                <div>
                  <p className="text-white font-medium">{s.title}</p>
                  <p className="text-gray-500 text-sm mt-0.5">
                    {s.difficulty} · {s.theme} · {s.mode === "GROUP" ? "👥 Group" : "👤 Solo"} · {s._count.participants} players
                  </p>
                </div>
                <span className="cyber-btn-primary text-xs py-1.5 px-4">
                  {s.status === "LOBBY" ? "Join Lobby" : "Rejoin"}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Generating */}
      {generating.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs font-semibold text-yellow-400 uppercase tracking-wider mb-3">Generating</h2>
          {generating.map((s) => (
            <div key={s.id} className="cyber-card flex items-center gap-3 border-yellow-500/20">
              <svg className="animate-spin h-5 w-5 text-yellow-400" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <div>
                <p className="text-white font-medium">Generating scenario...</p>
                <p className="text-gray-500 text-sm">{s.theme} · {s.difficulty}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Completed */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Completed ({completed.length})
        </h2>
        {completed.length === 0 ? (
          <div className="cyber-card text-center py-12">
            <p className="text-3xl mb-2">🎯</p>
            <p className="text-gray-400 mb-3">No completed exercises yet</p>
            <Link href="/portal/ttx/new" className="cyber-btn-primary text-sm">Launch Your First TTX</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {completed.map((s) => (
              <Link key={s.id} href={`/portal/ttx/${s.id}`}
                className="cyber-card flex items-center justify-between block hover:border-surface-4">
                <div>
                  <p className="text-white font-medium">{s.title}</p>
                  <p className="text-gray-500 text-sm mt-0.5">
                    {s.difficulty} · {s.theme} · {s._count.participants} players ·{" "}
                    {s.completedAt ? new Date(s.completedAt).toLocaleDateString() : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 text-xs">by {s.createdBy.firstName}</span>
                  <span className="cyber-badge bg-blue-500/20 text-blue-400 border-blue-500/30">Completed</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
