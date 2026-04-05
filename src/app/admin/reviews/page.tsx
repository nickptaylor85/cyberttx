import { db } from "@/lib/db";
export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  const recent = await db.ttxSession.findMany({
    where: { status: { in: ["COMPLETED", "IN_PROGRESS"] } },
    take: 20, orderBy: { createdAt: "desc" },
    include: {
      organization: { select: { name: true } },
      createdBy: { select: { firstName: true } },
      _count: { select: { participants: true } },
      feedback: true,
    },
  });

  const flagged = recent.filter(s => {
    if (s.feedback.length === 0) return false;
    const avg = s.feedback.reduce((a: number, f: any) => a + (f.avgScorePercent || 0), 0) / s.feedback.length;
    return avg < 40; // Flag scenarios where avg score is below 40%
  });

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl sm:text-2xl font-bold text-white">Scenario Review Queue</h1><p className="text-gray-500 text-xs sm:text-sm mt-1">{flagged.length} flagged (low scores) · {recent.length} recent</p></div>

      {flagged.length > 0 && (
        <div className="cyber-card border-orange-500/30 bg-orange-500/5 mb-6">
          <h2 className="text-orange-400 text-sm font-semibold mb-3">⚠️ Low Score Scenarios</h2>
          <p className="text-gray-400 text-xs mb-3">These scenarios may be too difficult, poorly generated, or need manual review.</p>
          <div className="space-y-2">{flagged.map(s => {
            const avg = s.feedback.reduce((a: number, f: any) => a + (f.avgScorePercent || 0), 0) / s.feedback.length;
            return (
              <div key={s.id} className="flex items-center justify-between py-2 border-b border-orange-500/10 last:border-0">
                <div><p className="text-white text-sm">{s.title}</p><p className="text-gray-500 text-xs">{s.organization?.name} · {s.theme}</p></div>
                <span className="text-orange-400 font-mono text-sm">{Math.round(avg)}%</span>
              </div>
            );
          })}</div>
        </div>
      )}

      <div className="cyber-card">
        <h2 className="text-white text-sm font-semibold mb-3">Recent Scenarios</h2>
        <div className="space-y-2">{recent.map(s => (
          <div key={s.id} className="flex items-center justify-between py-2 border-b border-surface-3/50 last:border-0">
            <div className="min-w-0 mr-3"><p className="text-white text-sm truncate">{s.title}</p><p className="text-gray-500 text-xs">{s.organization?.name} · {s.theme} · {s._count.participants} players</p></div>
            <div className="flex items-center gap-2">
              {s.feedback.length > 0 ? (
                <span className="text-gray-400 text-xs">{s.feedback.length} feedback</span>
              ) : (
                <span className="text-gray-600 text-xs">No feedback</span>
              )}
              <span className={`cyber-badge text-xs ${s.status === "COMPLETED" ? "bg-green-500/20 text-green-400" : "bg-blue-500/20 text-blue-400"}`}>{s.status}</span>
            </div>
          </div>
        ))}</div>
      </div>
    </div>
  );
}
