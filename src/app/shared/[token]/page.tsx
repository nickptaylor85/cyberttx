import { db } from "@/lib/db";
import Link from "next/link";
export const dynamic = "force-dynamic";

export default async function SharedExercisePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  let session: any = null;
  try {
    await db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS shared_exercises (id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, session_id TEXT NOT NULL, token TEXT NOT NULL UNIQUE, created_by TEXT, created_at TIMESTAMP DEFAULT NOW())`);
    const rows = await db.$queryRawUnsafe(`SELECT session_id FROM shared_exercises WHERE token = $1`, token) as any[];
    if (rows.length > 0) {
      session = await db.ttxSession.findUnique({
        where: { id: rows[0].session_id },
        select: { id: true, title: true, theme: true, difficulty: true, status: true, scenario: true, organization: { select: { name: true } }, participants: { include: { user: { select: { firstName: true } }, answers: { select: { isCorrect: true } } }, orderBy: { totalScore: "desc" } } },
      });
    }
  } catch {}

  if (!session) return (
    <div className="min-h-screen flex items-center justify-center"><div className="text-center"><p className="text-3xl mb-3">🔗</p><p className="text-gray-400 text-sm">Exercise not found or link expired</p><Link href="/" className="text-cyber-400 text-sm mt-4 inline-block">← Go to ThreatCast</Link></div></div>
  );

  const scenario = session.scenario as any;
  const totalQ = scenario?.stages?.reduce((sum: number, s: any) => sum + (s.questions?.length || 0), 0) || 0;

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Link href="/"><div className="w-10 h-10 rounded-xl bg-cyber-600 flex items-center justify-center mx-auto"><svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg></div></Link>
          <p className="text-gray-500 text-xs mt-3">Shared Exercise from {session.organization?.name || "ThreatCast"}</p>
          <h1 className="font-display text-2xl font-bold text-white mt-2">{session.title}</h1>
          <div className="flex gap-2 justify-center mt-3">
            <span className="cyber-badge text-xs bg-surface-3 text-gray-400">{session.theme}</span>
            <span className="cyber-badge text-xs bg-surface-3 text-gray-400">{session.difficulty}</span>
            <span className="cyber-badge text-xs bg-surface-3 text-gray-400">{totalQ} questions</span>
          </div>
        </div>

        {/* Scoreboard */}
        {session.participants.length > 0 && (
          <div className="cyber-card mb-6">
            <h2 className="text-white text-sm font-semibold mb-3">Results</h2>
            <div className="space-y-2">{session.participants.map((p: any, i: number) => {
              const correct = p.answers?.filter((a: any) => a.isCorrect).length || 0;
              const total = p.answers?.length || 0;
              const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
              return (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-surface-3/30 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}</span>
                    <p className="text-white text-sm">{p.user?.firstName || "Participant"}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-mono font-bold ${accuracy >= 70 ? "text-green-400" : accuracy >= 40 ? "text-yellow-400" : "text-red-400"}`}>{accuracy}%</p>
                    <p className="text-gray-500 text-xs">{correct}/{total}</p>
                  </div>
                </div>
              );
            })}</div>
          </div>
        )}

        <div className="text-center">
          <p className="text-gray-500 text-sm mb-4">Want to run your own exercises?</p>
          <Link href="/sign-up" className="cyber-btn-primary px-8 py-3">Try ThreatCast Free →</Link>
        </div>
      </div>
    </div>
  );
}
