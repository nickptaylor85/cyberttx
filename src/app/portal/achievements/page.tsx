import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth-helpers";
import Link from "next/link";
export const dynamic = "force-dynamic";

export default async function AchievementsPage() {
  const user = await getAuthUser();
  if (!user) return null;

  const participations = await db.ttxParticipant.findMany({
    where: { userId: user.id, session: { status: "COMPLETED" } },
    include: {
      answers: { select: { isCorrect: true } },
      session: { select: { theme: true, mode: true, createdById: true } },
    },
  });

  const count = participations.length;
  const perfects = participations.filter(p => p.answers.length > 0 && p.answers.every(a => a.isCorrect)).length;
  const themes = new Set(participations.map(p => p.session.theme).filter(Boolean));
  const didGroup = participations.some(p => p.session.mode === "GROUP");
  const didAlertExercise = false; // customIncident not stored in DB yet — coming in next schema update
  const othersOnMyExercises = await db.ttxParticipant.count({
    where: { session: { createdById: user.id, status: "COMPLETED" }, userId: { not: user.id } },
  });

  const achievements = [
    { id: "first-exercise",    name: "First Step",       icon: "🎯", desc: "Complete your first exercise",               earned: count >= 1,   progress: Math.min(count, 1),   max: 1 },
    { id: "five-exercises",    name: "Getting Started",  icon: "⭐", desc: "Complete 5 exercises",                        earned: count >= 5,   progress: Math.min(count, 5),   max: 5 },
    { id: "twenty-exercises",  name: "Committed",        icon: "💪", desc: "Complete 20 exercises",                       earned: count >= 20,  progress: Math.min(count, 20),  max: 20 },
    { id: "fifty-exercises",   name: "Veteran",          icon: "🏅", desc: "Complete 50 exercises",                       earned: count >= 50,  progress: Math.min(count, 50),  max: 50 },
    { id: "hundred-exercises", name: "Centurion",        icon: "🎖️", desc: "Complete 100 exercises",                      earned: count >= 100, progress: Math.min(count, 100), max: 100 },
    { id: "perfect-score",     name: "Flawless",         icon: "💎", desc: "Get 100% on an exercise",                    earned: perfects >= 1, progress: Math.min(perfects, 1), max: 1 },
    { id: "five-perfects",     name: "Perfectionist",    icon: "👑", desc: "Get 100% on 5 exercises",                    earned: perfects >= 5, progress: Math.min(perfects, 5), max: 5 },
    { id: "three-themes",      name: "Well-Rounded",     icon: "🌐", desc: "Complete 3 different threat themes",          earned: themes.size >= 3, progress: Math.min(themes.size, 3), max: 3 },
    { id: "all-themes",        name: "Threat Expert",    icon: "🧠", desc: "Complete all 8 threat themes",               earned: themes.size >= 8, progress: Math.min(themes.size, 8), max: 8 },
    { id: "real-world",        name: "Real-World Ready", icon: "🚨", desc: "Build an exercise from a live SIEM alert",   earned: didAlertExercise, progress: didAlertExercise ? 1 : 0, max: 1 },
    { id: "team-player",       name: "Team Player",      icon: "👥", desc: "Complete a multiplayer group exercise",       earned: didGroup,    progress: didGroup ? 1 : 0,     max: 1 },
    { id: "mentor",            name: "Mentor",           icon: "🎓", desc: "Have 5 team members attempt your exercise",  earned: othersOnMyExercises >= 5, progress: Math.min(othersOnMyExercises, 5), max: 5 },
  ];

  const earned = achievements.filter(a => a.earned).length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-white">Achievements</h1>
          <p className="text-gray-500 text-xs mt-1">{earned}/{achievements.length} unlocked</p>
        </div>
        {earned > 0 && <div className="text-2xl font-bold text-yellow-400 font-mono">{Math.round((earned / achievements.length) * 100)}%</div>}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {achievements.map(a => (
          <div key={a.id} className={`cyber-card transition-all ${a.earned ? "border-yellow-500/30 bg-yellow-500/3" : "opacity-60"}`}>
            <div className="flex items-center gap-3">
              <span className={`text-3xl ${a.earned ? "" : "grayscale"}`}>{a.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className={`text-sm font-semibold ${a.earned ? "text-white" : "text-gray-500"}`}>{a.name}</p>
                  {a.earned && <span className="text-yellow-400 text-xs">✓</span>}
                </div>
                <p className="text-gray-500 text-xs">{a.desc}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="h-1 flex-1 bg-surface-3 rounded-full">
                    <div className={`h-full rounded-full ${a.earned ? "bg-yellow-400" : "bg-gray-600"}`} style={{ width: `${(a.progress / a.max) * 100}%` }} />
                  </div>
                  <span className="text-gray-600 text-xs">{a.progress}/{a.max}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!achievements.find(a => a.id === "real-world")?.earned && (
        <div className="mt-4 cyber-card border-cyan-500/20">
          <p className="text-cyan-400 text-xs font-semibold mb-1">💡 Unlock Real-World Ready</p>
          <p className="text-gray-500 text-xs">Go to <Link href="/portal/alerts" className="text-cyber-400 underline">Live Alert Feed</Link> and use a real alert to generate an exercise.</p>
        </div>
      )}
    </div>
  );
}
