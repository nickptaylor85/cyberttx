export const dynamic = "force-dynamic";
export const maxDuration = 60;
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const QUICK_QUESTIONS = [
  { q: "A user reports their screen is locked with a ransom demand. What do you do first?", a: "Isolate the machine from the network", wrong: ["Pay the ransom", "Restart the computer"] },
  { q: "You see 50 failed login attempts from one IP. What type of attack is this?", a: "Brute force attack", wrong: ["Phishing", "SQL injection"] },
  { q: "An employee clicked a suspicious link. What's the priority?", a: "Check if credentials were entered and reset them", wrong: ["Fire the employee", "Ignore it"] },
  { q: "Your SIEM shows data exfiltration to an unknown IP. First step?", a: "Block the IP and investigate the source", wrong: ["Wait and monitor", "Shut down all systems"] },
  { q: "A vendor's software update contains malware. What type of attack?", a: "Supply chain attack", wrong: ["Insider threat", "DDoS"] },
  { q: "MFA is bypassed via session token theft. What technique is this?", a: "Pass-the-cookie / session hijacking", wrong: ["Password spraying", "Keylogging"] },
  { q: "An attacker is moving between systems using stolen credentials. What phase?", a: "Lateral movement", wrong: ["Initial access", "Exfiltration"] },
];

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!process.env.RESEND_API_KEY) return NextResponse.json({ status: "skipped" });

  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const question = QUICK_QUESTIONS[dayOfYear % QUICK_QUESTIONS.length];

  const orgs = await db.organization.findMany({
    where: { slug: { not: "__platform__" }, isDemo: false },
    include: { users: { where: { clerkId: { startsWith: "hash:" }, isActive: true }, select: { email: true, firstName: true }, take: 50 } },
  });

  let sent = 0;
  for (const org of orgs) {
    for (const user of org.users) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "ThreatCast <onboarding@resend.dev>", to: [user.email],
            subject: `🎯 Quick Question: ${question.q.slice(0, 50)}...`,
            html: `<div style="font-family:-apple-system,sans-serif;max-width:500px;margin:0 auto;padding:40px 20px;">
              <div style="font-size:20px;font-weight:700;margin-bottom:16px;">Threat<span style="color:#14b89a;">Cast</span> <span style="color:#888;font-size:12px;">Daily Drill</span></div>
              <h2 style="font-size:16px;color:#fff;background:#1a1a2e;padding:16px;border-radius:8px;border-left:3px solid #14b89a;">${question.q}</h2>
              <p style="color:#888;font-size:13px;margin-top:12px;">Think you know the answer? Do today's drill to find out.</p>
              <a href="https://threatcast.io/portal/daily-drill" style="display:inline-block;background:#14b89a;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">Answer Now →</a>
              <p style="color:#555;font-size:11px;margin-top:24px;">Takes less than 2 minutes. Keep your streak alive!</p>
            </div>`,
          }),
        });
        sent++;
      } catch {}
    }
  }

  return NextResponse.json({ status: "ok", sent });
}
