export const dynamic = "force-dynamic";
export const maxDuration = 60;
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";

const WEEKLY_THEMES = [
  { theme: "ransomware", title: "Ransomware Response Challenge", emoji: "🔒" },
  { theme: "phishing", title: "Phishing Defence Challenge", emoji: "🎣" },
  { theme: "apt", title: "APT Detection Challenge", emoji: "🕵️" },
  { theme: "insider-threat", title: "Insider Threat Challenge", emoji: "👤" },
  { theme: "supply-chain", title: "Supply Chain Attack Challenge", emoji: "📦" },
  { theme: "cloud-breach", title: "Cloud Security Challenge", emoji: "☁️" },
  { theme: "data-exfil", title: "Data Protection Challenge", emoji: "💾" },
  { theme: "ddos", title: "DDoS Response Challenge", emoji: "🌊" },
];

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ status: "skipped", reason: "No RESEND_API_KEY" });

  // Determine this week's challenge
  const now = new Date();
  const weekNum = Math.floor(now.getTime() / (7 * 24 * 60 * 60 * 1000));
  const challenge = WEEKLY_THEMES[weekNum % WEEKLY_THEMES.length];

  // Get all active users across all real portals
  const orgs = await db.organization.findMany({
    where: { slug: { not: "__platform__" }, isDemo: false },
    include: {
      users: {
        where: { clerkId: { startsWith: "hash:" }, isActive: true },
        select: { email: true, firstName: true },
      },
    },
  });

  let sent = 0;
  for (const org of orgs) {
    for (const user of org.users) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "ThreatCast <noreply@threatcast.io>",
            to: [user.email],
            subject: `🏅 New Weekly Challenge: ${challenge.title}`,
            html: `<div style="font-family:-apple-system,sans-serif;max-width:500px;margin:0 auto;padding:40px 20px;">
              <div style="font-size:20px;font-weight:700;margin-bottom:16px;">Threat<span style="color:#14b89a;">Cast</span></div>
              <h2 style="color:#14b89a;">🏅 This Week's Challenge</h2>
              <p>Hey ${user.firstName || "there"}, the new weekly challenge just dropped!</p>
              <div style="background:#1a1a2e;padding:20px;border-radius:8px;text-align:center;margin:16px 0;">
                <p style="font-size:36px;margin:0;">${challenge.emoji}</p>
                <p style="color:#fff;font-size:18px;font-weight:700;margin:8px 0 4px;">${challenge.title}</p>
                <p style="color:#888;font-size:13px;margin:0;">10 questions · Compete across the platform · Top 3 get medals</p>
              </div>
              <p style="color:#888;font-size:13px;">Everyone on ThreatCast is competing on the same challenge this week. Can you make the leaderboard?</p>
              <a href="https://threatcast.io/portal/challenge" style="display:inline-block;background:#14b89a;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">Take the Challenge →</a>
              <p style="color:#555;font-size:11px;margin-top:24px;">New challenge every Monday. Your best score counts. You can retry to improve.</p>
            </div>`,
          }),
        });
        sent++;
      } catch {}
    }
  }

  return NextResponse.json({ status: "ok", emailsSent: sent, challenge: challenge.title });
}
