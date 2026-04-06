export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

async function ensureTable() {
  await db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS user_xp (
    user_id TEXT PRIMARY KEY,
    total_xp INT DEFAULT 0,
    current_streak INT DEFAULT 0,
    best_streak INT DEFAULT 0,
    last_exercise_date DATE,
    exercises_completed INT DEFAULT 0,
    challenges_completed INT DEFAULT 0
  )`);
}

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
  await ensureTable();

  // Get or create XP record
  let rows = await db.$queryRawUnsafe(`SELECT * FROM user_xp WHERE user_id = $1`, user.id) as any[];
  if (rows.length === 0) {
    await db.$executeRawUnsafe(`INSERT INTO user_xp (user_id) VALUES ($1)`, user.id);
    rows = await db.$queryRawUnsafe(`SELECT * FROM user_xp WHERE user_id = $1`, user.id) as any[];
  }
  const xp = rows[0];

  // Calculate from actual exercise data
  const participations = await db.ttxParticipant.findMany({
    where: { userId: user.id, session: { status: "COMPLETED" } },
    include: { answers: { select: { isCorrect: true } }, session: { select: { completedAt: true, createdAt: true, difficulty: true } } },
    orderBy: { session: { createdAt: "desc" } },
  });

  // Calculate XP from exercises
  let totalXp = 0;
  const exerciseDates: string[] = [];

  participations.forEach(p => {
    const correct = p.answers.filter(a => a.isCorrect).length;
    const total = p.answers.length;
    const accuracy = total > 0 ? correct / total : 0;
    const diffMultiplier = p.session.difficulty === "EXPERT" ? 3 : p.session.difficulty === "ADVANCED" ? 2 : p.session.difficulty === "INTERMEDIATE" ? 1.5 : 1;

    // Base XP: 50 per exercise + accuracy bonus + difficulty multiplier
    const exerciseXp = Math.round((50 + accuracy * 50) * diffMultiplier);
    totalXp += exerciseXp;

    const date = (p.session.completedAt || p.session.createdAt).toISOString().split("T")[0];
    if (!exerciseDates.includes(date)) exerciseDates.push(date);
  });

  // Calculate streak (consecutive days with exercises)
  exerciseDates.sort().reverse();
  let streak = 0;
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  if (exerciseDates[0] === today || exerciseDates[0] === yesterday) {
    streak = 1;
    for (let i = 1; i < exerciseDates.length; i++) {
      const prev = new Date(exerciseDates[i - 1]);
      const curr = new Date(exerciseDates[i]);
      const diff = (prev.getTime() - curr.getTime()) / 86400000;
      if (diff <= 1) streak++;
      else break;
    }
  }

  // Determine level
  let currentLevel = LEVELS[0];
  let nextLevel = LEVELS[1];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVELS[i].xp) {
      currentLevel = LEVELS[i];
      nextLevel = LEVELS[i + 1] || LEVELS[i];
      break;
    }
  }

  const xpToNext = nextLevel.xp - totalXp;
  const progressPercent = currentLevel === nextLevel ? 100 : Math.min(100, Math.round(((totalXp - currentLevel.xp) / (nextLevel.xp - currentLevel.xp)) * 100));

  // Update stored XP
  await db.$executeRawUnsafe(
    `UPDATE user_xp SET total_xp = $1, current_streak = $2, best_streak = GREATEST(best_streak, $2), exercises_completed = $3, last_exercise_date = $4 WHERE user_id = $5`,
    totalXp, streak, participations.length, exerciseDates[0] || null, user.id
  );

  return NextResponse.json({
    totalXp,
    level: currentLevel,
    nextLevel,
    xpToNext: Math.max(0, xpToNext),
    progressPercent,
    streak,
    bestStreak: Math.max(streak, xp.best_streak || 0),
    exercisesCompleted: participations.length,
    allLevels: LEVELS,
  });
}
