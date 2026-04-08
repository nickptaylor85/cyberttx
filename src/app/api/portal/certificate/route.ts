export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  const user = await getAuthUser();
  if (!user?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const participant = await db.ttxParticipant.findFirst({
    where: { sessionId, userId: user.id },
    include: {
      session: { select: { title: true, theme: true, difficulty: true, completedAt: true, mitreAttackIds: true, organization: { select: { name: true } } } },
      user: { select: { firstName: true, lastName: true, email: true } },
      answers: true,
    },
  });
  if (!participant) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const s = participant.session;
  const correct = participant.answers.filter(a => a.isCorrect).length;
  const total = participant.answers.length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const name = `${participant.user.firstName || ""} ${participant.user.lastName || ""}`.trim() || participant.user.email;
  const date = s.completedAt ? new Date(s.completedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const mitre = (s.mitreAttackIds as string[]) || [];
  const grade = accuracy >= 90 ? "Platinum" : accuracy >= 75 ? "Gold" : accuracy >= 60 ? "Silver" : "Bronze";
  const gradeColor = grade === "Platinum" ? "#a78bfa" : grade === "Gold" ? "#fbbf24" : grade === "Silver" ? "#9ca3af" : "#d97706";

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Certificate — ${name}</title>
<style>
@page{margin:0;size:A4 landscape}body{margin:0;padding:0;font-family:'Georgia','Times New Roman',serif;background:#0a0a14}
.cert{width:297mm;height:210mm;position:relative;background:linear-gradient(135deg,#0f0f1e 0%,#1a1a2e 50%,#0f0f1e 100%);overflow:hidden;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
.border{position:absolute;inset:12mm;border:2px solid #14b89a;border-radius:8px}
.inner-border{position:absolute;inset:15mm;border:1px solid #14b89a33}
.corner{position:absolute;width:30px;height:30px;border-color:#14b89a;border-style:solid}
.tl{top:14mm;left:14mm;border-width:3px 0 0 3px}.tr{top:14mm;right:14mm;border-width:3px 3px 0 0}
.bl{bottom:14mm;left:14mm;border-width:0 0 3px 3px}.br{bottom:14mm;right:14mm;border-width:0 3px 3px 0}
.logo{font-size:16px;font-weight:700;letter-spacing:2px;margin-bottom:8px;font-family:system-ui}.logo span{color:#00ffd5}
.title{font-size:42px;font-weight:300;letter-spacing:8px;text-transform:uppercase;color:#14b89a;margin:16px 0 8px}
.subtitle{font-size:14px;color:#888;letter-spacing:4px;text-transform:uppercase;margin-bottom:32px}
.name{font-size:36px;font-weight:700;margin:8px 0;background:linear-gradient(90deg,#14b89a,#67e8f9);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.details{font-size:15px;color:#aaa;margin:4px 0;line-height:1.8}
.grade-badge{display:inline-block;padding:8px 24px;border:2px solid ${gradeColor};border-radius:24px;color:${gradeColor};font-size:18px;font-weight:700;letter-spacing:3px;margin:20px 0}
.score{font-size:48px;font-weight:700;color:${gradeColor};margin:8px 0}
.mitre{color:#666;font-size:11px;font-family:monospace;margin-top:16px}
.footer{position:absolute;bottom:20mm;left:0;right:0;text-align:center;color:#555;font-size:11px}
.seal{position:absolute;bottom:24mm;right:30mm;width:60px;height:60px;border:2px solid #14b89a;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px}
</style></head><body>
<div class="cert">
<div class="border"></div><div class="inner-border"></div>
<div class="corner tl"></div><div class="corner tr"></div><div class="corner bl"></div><div class="corner br"></div>
<div class="logo" style="font-family:monospace;letter-spacing:3px;">THREAT<span>CAST</span></div>
<div class="title">Certificate</div>
<div class="subtitle">of completion</div>
<p class="details">This certifies that</p>
<p class="name">${name}</p>
<p class="details">has successfully completed the cybersecurity tabletop exercise</p>
<p class="details" style="color:#fff;font-size:18px;font-style:italic;margin:8px 0 16px">"${s.title}"</p>
<div class="grade-badge">${grade.toUpperCase()}</div>
<div class="score">${accuracy}%</div>
<p class="details">${correct}/${total} correct · ${s.difficulty} difficulty · ${s.theme}</p>
<p class="details">${s.organization?.name || "ThreatCast"} · ${date}</p>
${mitre.length > 0 ? `<p class="mitre">MITRE ATT&CK: ${mitre.join(", ")}</p>` : ""}
<div class="seal">🛡️</div>
<div class="footer">Issued by ThreatCast · threatcast.io · Certificate ID: TC-${sessionId.slice(-8).toUpperCase()}</div>
</div></body></html>`;

  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
