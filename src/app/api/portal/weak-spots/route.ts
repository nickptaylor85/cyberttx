export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const participations = await db.ttxParticipant.findMany({
      where: { userId: user.id, session: { status: "COMPLETED" } },
      include: {
        answers: { select: { isCorrect: true, questionIndex: true } },
        session: { select: { theme: true, difficulty: true, mitreAttackIds: true, scenario: true } },
      },
    });

    // Accuracy per theme
    const themeStats: Record<string, { correct: number; total: number }> = {};
    // Accuracy per MITRE technique
    const mitreStats: Record<string, { correct: number; total: number }> = {};

    participations.forEach(p => {
      const theme = p.session.theme || "unknown";
      if (!themeStats[theme]) themeStats[theme] = { correct: 0, total: 0 };
      p.answers.forEach(a => {
        themeStats[theme].total++;
        if (a.isCorrect) themeStats[theme].correct++;
      });

      // Attribute MITRE techniques
      const techniques = (p.session.mitreAttackIds as string[]) || [];
      techniques.forEach(t => {
        if (!mitreStats[t]) mitreStats[t] = { correct: 0, total: 0 };
        p.answers.forEach(a => {
          mitreStats[t].total++;
          if (a.isCorrect) mitreStats[t].correct++;
        });
      });
    });

    // Find weakest themes (below 60% accuracy, min 5 answers)
    const weakThemes = Object.entries(themeStats)
      .map(([theme, stats]) => ({ theme, accuracy: Math.round((stats.correct / stats.total) * 100), total: stats.total }))
      .filter(t => t.total >= 5 && t.accuracy < 60)
      .sort((a, b) => a.accuracy - b.accuracy);

    // Find weakest MITRE techniques
    const weakMitre = Object.entries(mitreStats)
      .map(([technique, stats]) => ({ technique, accuracy: Math.round((stats.correct / stats.total) * 100), total: stats.total }))
      .filter(t => t.total >= 3 && t.accuracy < 60)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 10);

    // Find strongest themes for encouragement
    const strongThemes = Object.entries(themeStats)
      .map(([theme, stats]) => ({ theme, accuracy: Math.round((stats.correct / stats.total) * 100), total: stats.total }))
      .filter(t => t.total >= 5 && t.accuracy >= 70)
      .sort((a, b) => b.accuracy - a.accuracy);

    // Suggested next exercise
    const suggestedTheme = weakThemes[0]?.theme || "ransomware";
    const suggestedDifficulty = weakThemes[0]?.accuracy
      ? (weakThemes[0].accuracy < 30 ? "BEGINNER" : weakThemes[0].accuracy < 50 ? "INTERMEDIATE" : "ADVANCED")
      : "INTERMEDIATE";

    return NextResponse.json({
      weakThemes, strongThemes, weakMitre,
      suggestion: { theme: suggestedTheme, difficulty: suggestedDifficulty },
      totalExercises: participations.length,
    });
  } catch (e: any) {
    return NextResponse.json({ weakThemes: [], strongThemes: [], weakMitre: [], suggestion: { theme: "ransomware", difficulty: "INTERMEDIATE" }, totalExercises: 0 });
  }
}
