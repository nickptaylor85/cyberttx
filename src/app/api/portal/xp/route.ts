export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

const LEVELS = [
  { level: 1, name: "Recruit", xp: 0 },
  { level: 2, name: "Analyst", xp: 100 },
  { level: 3, name: "Responder", xp: 300 },
  { level: 4, name: "Investigator", xp: 600 },
  { level: 5, name: "Specialist", xp: 1000 },
  { level: 6, name: "Lead", xp: 1500 },
  { level: 7, name: "Expert", xp: 2500 },
  { level: 8, name: "Senior Expert", xp: 4000 },
  { level: 9, name: "Master", xp: 6000 },
  { level: 10, name: "Elite Defender", xp: 10000 },
];

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Use stored XP if available; fall back to calculating from exercises for users who existed before this feature
    let totalXp = user.xpTotal || 0;
    if (totalXp === 0) {
      const participations = await db.ttxParticipant.findMany({
        where: { userId: user.id, session: { status: "COMPLETED" } },
        include: { answers: { select: { isCorrect: true } }, session: { select: { difficulty: true } } },
      });
      participations.forEach(p => {
        const correct = p.answers.filter(a => a.isCorrect).length;
        const total = p.answers.length;
        const accuracy = total > 0 ? correct / total : 0;
        const d = p.session.difficulty;
        const mult = d === "EXPERT" ? 3 : d === "ADVANCED" ? 2 : d === "INTERMEDIATE" ? 1.5 : 1;
        totalXp += Math.round((50 + accuracy * 50) * mult);
      });
    }

    // Streak — use stored value, validate it's still current
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const lastDate = user.streakLastDate ? user.streakLastDate.toISOString().split("T")[0] : null;
    const streak = (lastDate === today || lastDate === yesterday) ? (user.streakDays || 0) : 0;

    let currentLevel = LEVELS[0];
    let nextLevel = LEVELS[1];
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (totalXp >= LEVELS[i].xp) {
        currentLevel = LEVELS[i];
        nextLevel = LEVELS[i + 1] || LEVELS[i];
        break;
      }
    }

    const exercisesCompleted = await db.ttxParticipant.count({
      where: { userId: user.id, session: { status: "COMPLETED" } },
    });

    return NextResponse.json({
      totalXp,
      level: currentLevel,
      nextLevel,
      xpToNext: Math.max(0, nextLevel.xp - totalXp),
      progressPercent: currentLevel === nextLevel ? 100 : Math.min(100, Math.round(((totalXp - currentLevel.xp) / (nextLevel.xp - currentLevel.xp)) * 100)),
      streak,
      bestStreak: user.bestStreak || streak,
      exercisesCompleted,
    });
  } catch (e: any) {
    return NextResponse.json({ totalXp: 0, level: LEVELS[0], nextLevel: LEVELS[1], xpToNext: 100, progressPercent: 0, streak: 0, bestStreak: 0, exercisesCompleted: 0 });
  }
}
