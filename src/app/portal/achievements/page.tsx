import { db } from "@/lib/db";
import { getAuthUser } from "@/lib/auth-helpers";
export const dynamic = "force-dynamic";

export default async function AchievementsPage() {
  const user = await getAuthUser();
  if (!user) return null;

  const participations = await db.ttxParticipant.count({ where: { userId: user.id, session: { status: "COMPLETED" } } });
  const perfectScores = await db.ttxParticipant.findMany({
    where: { userId: user.id, session: { status: "COMPLETED" } },
    include: { answers: { select: { isCorrect: true } } },
  });
  const perfects = perfectScores.filter(p => p.answers.length > 0 && p.answers.every(a => a.isCorrect)).length;
  const themes = await db.ttxSession.findMany({
    where: { participants: { some: { userId: user.id } }, status: "COMPLETED" },
    select: { theme: true }, distinct: ["theme"],
  });

  const achievements = [
    { id: "first-exercise", name: "First Step", icon: "🎯", desc: "Complete your first exercise", earned: participations >= 1, progress: Math.min(participations, 1), max: 1 },
    { id: "five-exercises", name: "Getting Started", icon: "⭐", desc: "Complete 5 exercises", earned: participations >= 5, progress: Math.min(participations, 5), max: 5 },
    { id: "twenty-exercises", name: "Committed", icon: "💪", desc: "Complete 20 exercises", earned: participations >= 20, progress: Math.min(participations, 20), max: 20 },
    { id: "fifty-exercises", name: "Veteran", icon: "🏅", desc: "Complete 50 exercises", earned: participations >= 50, progress: Math.min(participations, 50), max: 50 },
    { id: "hundred-exercises", name: "Centurion", icon: "🎖️", desc: "Complete 100 exercises", earned: participations >= 100, progress: Math.min(participations, 100), max: 100 },
    { id: "perfect-score", name: "Flawless", icon: "💎", desc: "Get 100% on an exercise", earned: perfects >= 1, progress: Math.min(perfects, 1), max: 1 },
    { id: "five-perfects", name: "Perfectionist", icon: "👑", desc: "Get 100% on 5 exercises", earned: perfects >= 5, progress: Math.min(perfects, 5), max: 5 },
    { id: "three-themes", name: "Well-Rounded", icon: "🌐", desc: "Complete 3 different threat themes", earned: themes.length >= 3, progress: Math.min(themes.length, 3), max: 3 },
    { id: "all-themes", name: "Threat Expert", icon: "🧠", desc: "Complete all 8 threat themes", earned: themes.length >= 8, progress: Math.min(themes.length, 8), max: 8 },
    { id: "real-world", name: "Real-World Ready", icon: "🚨", desc: "Build an exercise from a live SIEM alert", earned: false, progress: 0, max: 1 },
    { id: "team-player", name: "Team Player", icon: "👥", desc: "Complete a multiplayer exercise", earned: false, progress: 0, max: 1 },
    { id: "mentor", name: "Mentor", icon: "🎓", desc: "Have 5 team members attempt your exercise", earned: false, progress: 0, max: 1 },
  ];

  const earned = achievements.filter(a => a.earned).length;

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl sm:text-2xl font-bold text-white">Achievements</h1><p className="text-gray-500 text-xs mt-1">{earned}/{achievements.length} unlocked</p></div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{achievements.map(a => (
        <div key={a.id} className={`cyber-card transition-all ${a.earned ? "border-yellow-500/30" : "opacity-60"}`}>
          <div className="flex items-center gap-3">
            <span className={`text-3xl ${a.earned ? "" : "grayscale"}`}>{a.icon}</span>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${a.earned ? "text-white" : "text-gray-500"}`}>{a.name}</p>
              <p className="text-gray-500 text-xs">{a.desc}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="h-1 flex-1 bg-surface-3 rounded-full"><div className={`h-full rounded-full ${a.earned ? "bg-yellow-400" : "bg-gray-600"}`} style={{ width: `${(a.progress / a.max) * 100}%` }} /></div>
                <span className="text-gray-600 text-xs">{a.progress}/{a.max}</span>
              </div>
            </div>
          </div>
        </div>
      ))}</div>
    </div>
  );
}
