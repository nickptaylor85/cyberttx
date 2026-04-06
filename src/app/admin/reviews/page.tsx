import { db } from "@/lib/db";
export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  // Get recent exercises with low scores
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
    return avg < 40;
  });

  // Get user feedback from exercise_feedback table
  let userFeedback: any[] = [];
  try {
    await db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS exercise_feedback (id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, session_id TEXT NOT NULL, user_id TEXT NOT NULL, user_name TEXT, org_name TEXT, rating INT NOT NULL, comment TEXT, created_at TIMESTAMP DEFAULT NOW())`);
    userFeedback = await db.$queryRawUnsafe(`SELECT * FROM exercise_feedback ORDER BY created_at DESC LIMIT 50`) as any[];
  } catch {}

  const avgRating = userFeedback.length > 0 ? (userFeedback.reduce((a, f) => a + (f.rating || 0), 0) / userFeedback.length).toFixed(1) : "—";
  const lowRated = userFeedback.filter(f => f.rating <= 2);

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl font-bold text-white">Review Queue</h1><p className="text-gray-500 text-xs mt-1">{flagged.length} flagged scenarios · {userFeedback.length} user ratings · Avg rating: {avgRating}/5</p></div>

      {/* User Feedback */}
      <div className="cyber-card mb-4">
        <h2 className="text-white text-sm font-semibold mb-3">User Feedback ({userFeedback.length})</h2>
        {userFeedback.length === 0 ? <p className="text-gray-500 text-xs">No feedback yet. Users can rate exercises after completion.</p> :
          <div className="space-y-2">{userFeedback.slice(0, 20).map((f: any) => (
            <div key={f.id} className={`flex items-center justify-between py-2 border-b border-surface-3/30 last:border-0 ${f.rating <= 2 ? "bg-red-500/5 -mx-2 px-2 rounded" : ""}`}>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400 text-xs">{"★".repeat(f.rating)}{"☆".repeat(5 - f.rating)}</span>
                  <span className="text-white text-xs">{f.user_name || "Anonymous"}</span>
                  <span className="text-gray-600 text-xs">{f.org_name}</span>
                </div>
                {f.comment && <p className="text-gray-400 text-xs mt-0.5">{f.comment}</p>}
              </div>
              <span className="text-gray-600 text-xs flex-shrink-0">{new Date(f.created_at).toLocaleDateString("en-GB")}</span>
            </div>
          ))}</div>
        }
      </div>

      {/* Low-rated flagged */}
      {lowRated.length > 0 && (
        <div className="cyber-card border-red-500/20 mb-4">
          <h2 className="text-red-400 text-sm font-semibold mb-3">⚠️ Low Ratings (1-2 stars)</h2>
          <div className="space-y-2">{lowRated.map((f: any) => (
            <div key={f.id} className="flex items-center justify-between py-1.5">
              <div><span className="text-red-400 text-xs">{"★".repeat(f.rating)}{"☆".repeat(5 - f.rating)}</span> <span className="text-gray-400 text-xs">{f.user_name} · {f.org_name}</span></div>
              <span className="text-gray-600 text-xs">{f.session_id?.slice(-8)}</span>
            </div>
          ))}</div>
        </div>
      )}

      {/* Low score scenarios */}
      {flagged.length > 0 && (
        <div className="cyber-card border-orange-500/20 mb-4">
          <h2 className="text-orange-400 text-sm font-semibold mb-3">⚠️ Low Score Scenarios</h2>
          <p className="text-gray-400 text-xs mb-3">These scenarios may be too difficult or poorly generated.</p>
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

      {/* All recent */}
      <div className="cyber-card">
        <h2 className="text-white text-sm font-semibold mb-3">Recent Scenarios</h2>
        <div className="space-y-2">{recent.map(s => (
          <div key={s.id} className="flex items-center justify-between py-2 border-b border-surface-3/50 last:border-0">
            <div className="min-w-0 mr-3"><p className="text-white text-sm truncate">{s.title}</p><p className="text-gray-500 text-xs">{s.organization?.name} · {s.theme} · {s._count.participants} players</p></div>
            <span className={`cyber-badge text-xs ${s.status === "COMPLETED" ? "bg-green-500/20 text-green-400" : "bg-blue-500/20 text-blue-400"}`}>{s.status}</span>
          </div>
        ))}</div>
      </div>
    </div>
  );
}
