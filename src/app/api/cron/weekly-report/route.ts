export const dynamic = "force-dynamic";
export const maxDuration = 60;
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Get all active orgs (exclude __platform__ and demos)
  const orgs = await db.organization.findMany({
    where: { slug: { not: "__platform__" }, isDemo: false },
    include: {
      profile: { select: { additionalContext: true } },
      users: { where: { role: "CLIENT_ADMIN" }, select: { email: true, firstName: true } },
    },
  });

  let sent = 0;

  for (const org of orgs) {
    // Check if weekly reports are enabled (default: yes)
    const ctx = org.profile?.additionalContext || "";
    if (ctx.includes("WEEKLY_REPORT:disabled")) continue;

    const adminEmails = org.users.map(u => u.email).filter(Boolean);
    if (adminEmails.length === 0) continue;

    // Get this week's stats
    const weekSessions = await db.ttxSession.count({
      where: { orgId: org.id, status: "COMPLETED", completedAt: { gte: oneWeekAgo } },
    });
    const weekParticipants = await db.ttxParticipant.findMany({
      where: { session: { orgId: org.id, status: "COMPLETED", completedAt: { gte: oneWeekAgo } } },
      include: { answers: { select: { isCorrect: true } } },
    });
    const totalAnswers = weekParticipants.flatMap(p => p.answers);
    const correctAnswers = totalAnswers.filter(a => a.isCorrect).length;
    const accuracy = totalAnswers.length > 0 ? Math.round((correctAnswers / totalAnswers.length) * 100) : 0;
    const activeUsers = new Set(weekParticipants.map(p => p.userId)).size;

    // All-time stats for context
    const totalExercises = await db.ttxSession.count({ where: { orgId: org.id, status: "COMPLETED" } });
    const totalUsers = await db.user.count({ where: { orgId: org.id, clerkId: { startsWith: "hash:" } } });

    // Only send if there's activity (or once a month even if no activity)
    if (weekSessions === 0 && new Date().getDate() > 7) continue;

    // Send email
    if (process.env.RESEND_API_KEY) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "ThreatCast <onboarding@resend.dev>",
            to: adminEmails,
            subject: `ThreatCast Weekly Report — ${org.name}`,
            html: `
              <div style="font-family:-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;background:#0f0f1e;color:#fff;">
                <div style="font-size:20px;font-weight:700;margin-bottom:24px;">Threat<span style="color:#14b89a;">Cast</span> <span style="color:#666;font-size:14px;">Weekly Report</span></div>
                <h2 style="color:#fff;font-size:18px;margin-bottom:16px;">${org.name} — Week of ${oneWeekAgo.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</h2>
                
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px;">
                  <div style="background:#1a1a2e;padding:16px;border-radius:8px;text-align:center;">
                    <div style="font-size:28px;font-weight:700;color:#14b89a;">${weekSessions}</div>
                    <div style="font-size:12px;color:#888;">Exercises This Week</div>
                  </div>
                  <div style="background:#1a1a2e;padding:16px;border-radius:8px;text-align:center;">
                    <div style="font-size:28px;font-weight:700;color:${accuracy >= 70 ? '#22c55e' : accuracy >= 40 ? '#eab308' : '#ef4444'};">${accuracy}%</div>
                    <div style="font-size:12px;color:#888;">Avg Accuracy</div>
                  </div>
                  <div style="background:#1a1a2e;padding:16px;border-radius:8px;text-align:center;">
                    <div style="font-size:28px;font-weight:700;color:#fff;">${activeUsers}</div>
                    <div style="font-size:12px;color:#888;">Active Users</div>
                  </div>
                  <div style="background:#1a1a2e;padding:16px;border-radius:8px;text-align:center;">
                    <div style="font-size:28px;font-weight:700;color:#fff;">${totalExercises}</div>
                    <div style="font-size:12px;color:#888;">Total Exercises</div>
                  </div>
                </div>

                ${weekSessions === 0 ? '<p style="color:#888;font-size:14px;">No exercises completed this week. Encourage your team to run a drill!</p>' : `<p style="color:#888;font-size:14px;">${activeUsers} team member${activeUsers !== 1 ? 's' : ''} completed ${weekSessions} exercise${weekSessions !== 1 ? 's' : ''} with ${accuracy}% average accuracy.</p>`}
                
                <div style="margin-top:24px;padding-top:16px;border-top:1px solid #333;">
                  <p style="color:#666;font-size:12px;">Your team: ${totalUsers} members · ${totalExercises} total exercises</p>
                </div>
                
                <a href="https://threatcast.io/portal" style="display:inline-block;background:#14b89a;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">Open Dashboard →</a>
                
                <p style="color:#555;font-size:11px;margin-top:24px;">This is an automated weekly report from ThreatCast. To disable, go to Settings → Notifications in your portal.</p>
              </div>
            `,
          }),
        });
        sent++;
      } catch {}
    }
  }

  return NextResponse.json({ status: "ok", reportsSent: sent, orgsChecked: orgs.length });
}
