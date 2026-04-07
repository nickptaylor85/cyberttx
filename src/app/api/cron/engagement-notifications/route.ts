export const dynamic = "force-dynamic";
export const maxDuration = 60;
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ status: "skipped", reason: "No RESEND_API_KEY" });

  let sent = 0;
  const yesterday = new Date(Date.now() - 86400000);
  const twoDaysAgo = new Date(Date.now() - 2 * 86400000);

  // Get all active users
  const users = await db.user.findMany({
    where: { clerkId: { startsWith: "hash:" }, isActive: true },
    select: { id: true, email: true, firstName: true, orgId: true },
  });

  for (const user of users) {
    // Check if they had activity yesterday but not today (streak at risk)
    const yesterdayExercise = await db.ttxParticipant.findFirst({
      where: { userId: user.id, session: { status: "COMPLETED", completedAt: { gte: yesterday, lt: new Date() } } },
    });
    const todayExercise = await db.ttxParticipant.findFirst({
      where: { userId: user.id, session: { status: "COMPLETED", completedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } },
    });

    if (yesterdayExercise && !todayExercise) {
      // Streak at risk — nudge them
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "ThreatCast <onboarding@resend.dev>", to: [user.email],
            subject: "🔥 Your streak is about to expire!",
            html: `<div style="font-family:-apple-system,sans-serif;max-width:500px;margin:0 auto;padding:40px 20px;"><div style="font-size:20px;font-weight:700;margin-bottom:16px;">Threat<span style="color:#14b89a;">Cast</span></div><h2 style="color:#f97316;">🔥 Your streak expires today!</h2><p>Hey ${user.firstName || "there"}, you've been on a roll. Don't break your streak — it only takes 2 minutes.</p><a href="https://threatcast.io/portal/daily-drill" style="display:inline-block;background:#14b89a;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">Do Today's Drill →</a><p style="color:#888;font-size:12px;margin-top:24px;">Or try the <a href="https://threatcast.io/portal/challenge" style="color:#14b89a;">weekly challenge</a>.</p></div>`,
          }),
        });
        sent++;
      } catch {}
    }

    // Dormant user — hasn't done anything in a week
    const lastExercise = await db.ttxParticipant.findFirst({
      where: { userId: user.id, session: { status: "COMPLETED" } },
      orderBy: { session: { completedAt: "desc" } },
      include: { session: { select: { completedAt: true } } },
    });

    if (lastExercise?.session?.completedAt && lastExercise.session.completedAt < twoDaysAgo && lastExercise.session.completedAt > new Date(Date.now() - 8 * 86400000)) {
      // Inactive for 2-7 days — send re-engagement
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "ThreatCast <onboarding@resend.dev>", to: [user.email],
            subject: "New exercises waiting for you",
            html: `<div style="font-family:-apple-system,sans-serif;max-width:500px;margin:0 auto;padding:40px 20px;"><div style="font-size:20px;font-weight:700;margin-bottom:16px;">Threat<span style="color:#14b89a;">Cast</span></div><h2>Your team has been training without you 👀</h2><p>Hey ${user.firstName || "there"}, this week's challenge is live and your colleagues are climbing the leaderboard.</p><a href="https://threatcast.io/portal/challenge" style="display:inline-block;background:#14b89a;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">Jump Back In →</a></div>`,
          }),
        });
        sent++;
      } catch {}
    }
  }

  return NextResponse.json({ status: "ok", emailsSent: sent, usersChecked: users.length });
}
