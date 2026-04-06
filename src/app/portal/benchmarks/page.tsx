import { db } from "@/lib/db";
import { getPortalOrg } from "@/lib/auth-helpers";
export const dynamic = "force-dynamic";

export default async function BenchmarksPage() {
  const org = await getPortalOrg();
  if (!org) return <p className="text-red-400 p-8">Organization not found</p>;

  // Your org stats
  const yourSessions = await db.ttxSession.findMany({ where: { orgId: org.id, status: "COMPLETED" }, include: { participants: { include: { answers: true } } } });
  const yourCorrect = yourSessions.flatMap(s => s.participants).flatMap(p => p.answers).filter(a => a.isCorrect).length;
  const yourTotal = yourSessions.flatMap(s => s.participants).flatMap(p => p.answers).length;
  const yourAccuracy = yourTotal > 0 ? Math.round((yourCorrect / yourTotal) * 100) : 0;
  const yourExercises = yourSessions.length;

  // Platform averages (anonymised)
  const allSessions = await db.ttxSession.count({ where: { status: "COMPLETED" } });
  const allAnswers = await db.ttxAnswer.count();
  const allCorrect = await db.ttxAnswer.count({ where: { isCorrect: true } });
  const platformAccuracy = allAnswers > 0 ? Math.round((allCorrect / allAnswers) * 100) : 0;
  const allOrgs = await db.organization.count({ where: { isDemo: false } });
  const avgExercisesPerOrg = allOrgs > 0 ? Math.round(allSessions / allOrgs) : 0;

  function compare(yours: number, platform: number): { label: string; color: string } {
    const diff = yours - platform;
    if (diff >= 10) return { label: `+${diff}% above average`, color: "text-green-400" };
    if (diff >= 0) return { label: `${diff >= 0 ? "+" : ""}${diff}% on par`, color: "text-cyan-400" };
    if (diff >= -10) return { label: `${diff}% slightly below`, color: "text-yellow-400" };
    return { label: `${diff}% below average`, color: "text-red-400" };
  }

  const accComp = compare(yourAccuracy, platformAccuracy);
  const exComp = compare(yourExercises, avgExercisesPerOrg);

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl sm:text-2xl font-bold text-white">Benchmarks</h1><p className="text-gray-500 text-xs mt-1">Compare your portal against anonymised platform averages</p></div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <div className="cyber-card">
          <h2 className="text-white text-sm font-semibold mb-4">Accuracy</h2>
          <div className="flex items-end gap-6 justify-center mb-4">
            <div className="text-center"><div className="h-32 w-16 bg-surface-3 rounded-t relative"><div className="absolute bottom-0 w-full bg-cyber-500 rounded-t" style={{ height: `${yourAccuracy}%` }} /></div><p className="text-white text-sm font-bold mt-2">{yourAccuracy}%</p><p className="text-gray-500 text-xs">You</p></div>
            <div className="text-center"><div className="h-32 w-16 bg-surface-3 rounded-t relative"><div className="absolute bottom-0 w-full bg-gray-500 rounded-t" style={{ height: `${platformAccuracy}%` }} /></div><p className="text-gray-400 text-sm font-bold mt-2">{platformAccuracy}%</p><p className="text-gray-500 text-xs">Platform</p></div>
          </div>
          <p className={`text-center text-sm font-semibold ${accComp.color}`}>{accComp.label}</p>
        </div>

        <div className="cyber-card">
          <h2 className="text-white text-sm font-semibold mb-4">Exercise Volume</h2>
          <div className="flex items-end gap-6 justify-center mb-4">
            <div className="text-center"><div className="h-32 w-16 bg-surface-3 rounded-t relative"><div className="absolute bottom-0 w-full bg-cyber-500 rounded-t" style={{ height: `${Math.min((yourExercises / Math.max(avgExercisesPerOrg, 1)) * 50, 100)}%` }} /></div><p className="text-white text-sm font-bold mt-2">{yourExercises}</p><p className="text-gray-500 text-xs">You</p></div>
            <div className="text-center"><div className="h-32 w-16 bg-surface-3 rounded-t relative"><div className="absolute bottom-0 w-full bg-gray-500 rounded-t" style={{ height: "50%" }} /></div><p className="text-gray-400 text-sm font-bold mt-2">{avgExercisesPerOrg}</p><p className="text-gray-500 text-xs">Avg</p></div>
          </div>
          <p className={`text-center text-sm font-semibold ${exComp.color}`}>{exComp.label}</p>
        </div>
      </div>

      <div className="cyber-card">
        <h2 className="text-white text-sm font-semibold mb-3">Platform Stats (Anonymised)</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 rounded bg-surface-0 border border-surface-3 text-center"><p className="font-display text-xl font-bold text-gray-400">{allSessions}</p><p className="text-gray-500 text-xs">Total Exercises</p></div>
          <div className="p-3 rounded bg-surface-0 border border-surface-3 text-center"><p className="font-display text-xl font-bold text-gray-400">{platformAccuracy}%</p><p className="text-gray-500 text-xs">Avg Accuracy</p></div>
          <div className="p-3 rounded bg-surface-0 border border-surface-3 text-center"><p className="font-display text-xl font-bold text-gray-400">{allOrgs}</p><p className="text-gray-500 text-xs">Active Portals</p></div>
          <div className="p-3 rounded bg-surface-0 border border-surface-3 text-center"><p className="font-display text-xl font-bold text-gray-400">{avgExercisesPerOrg}</p><p className="text-gray-500 text-xs">Avg/Portal</p></div>
        </div>
      </div>
    </div>
  );
}
