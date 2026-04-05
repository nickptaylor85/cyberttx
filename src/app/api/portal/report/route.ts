export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });

  const user = await getAuthUser();
  if (!user?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const session = await db.ttxSession.findFirst({
    where: { id: sessionId, orgId: user.orgId },
    include: {
      participants: { include: { user: { select: { firstName: true, lastName: true } }, answers: true } },
      organization: { select: { name: true, logo: true, profile: { select: { industry: true, companySize: true } } } },
    },
  });
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const scenario = session.scenario as any;
  const totalQ = session.participants[0]?.answers.length || 0;
  const avgScore = session.participants.length > 0 ? Math.round(session.participants.reduce((s, p) => s + p.totalScore, 0) / session.participants.length) : 0;
  const avgAcc = session.participants.length > 0 ? Math.round(session.participants.reduce((s, p) => s + (p.answers.filter(a => a.isCorrect).length / Math.max(p.answers.length, 1)) * 100, 0) / session.participants.length) : 0;
  const topScorer = session.participants.sort((a, b) => b.totalScore - a.totalScore)[0];
  const mitre = (session.mitreAttackIds as string[]) || [];

  // Risk rating based on accuracy
  const riskLevel = avgAcc >= 75 ? "LOW" : avgAcc >= 50 ? "MEDIUM" : "HIGH";
  const riskColor = riskLevel === "LOW" ? "#22c55e" : riskLevel === "MEDIUM" ? "#f59e0b" : "#ef4444";

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${session.title} — Executive Report</title>
<style>
@page{margin:2cm;size:A4}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1a1a2e;line-height:1.6;max-width:800px;margin:0 auto;padding:40px}
.header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #14b89a;padding-bottom:20px;margin-bottom:30px}
.logo{font-size:24px;font-weight:700}.logo span{color:#14b89a}.badge{background:#14b89a;color:white;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600}
h1{font-size:20px;margin:0 0 8px}h2{font-size:16px;color:#14b89a;margin-top:30px;border-bottom:1px solid #eee;padding-bottom:8px}h3{font-size:14px;margin-top:20px}
.meta{color:#666;font-size:13px}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin:20px 0}
.stat{background:#f8f9fa;border-radius:12px;padding:20px;text-align:center}.stat-value{font-size:32px;font-weight:700;color:#14b89a}.stat-label{font-size:11px;color:#666;margin-top:4px;text-transform:uppercase;letter-spacing:0.5px}
.risk-badge{display:inline-block;padding:6px 16px;border-radius:8px;font-weight:700;font-size:14px;color:white;background:${riskColor}}
table{width:100%;border-collapse:collapse;margin:16px 0;font-size:13px}th,td{padding:10px 12px;text-align:left;border-bottom:1px solid #eee}th{background:#f8f9fa;font-weight:600}
.mitre{display:inline-block;background:#e8f5f1;color:#14b89a;padding:2px 8px;border-radius:4px;font-size:11px;font-family:monospace;margin:2px}
.narrative{background:#f8f9fa;padding:16px;border-radius:8px;border-left:4px solid #14b89a;margin:16px 0;font-size:13px}
.footer{margin-top:40px;padding-top:20px;border-top:1px solid #eee;color:#999;font-size:11px;text-align:center}
.exec-summary{background:linear-gradient(135deg,#f0fdf9,#f8f9fa);border:1px solid #d1fae5;border-radius:12px;padding:24px;margin:20px 0}
.benchmark{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin:16px 0}.benchmark-item{text-align:center;padding:12px;background:#f8f9fa;border-radius:8px}
.benchmark-value{font-size:24px;font-weight:700}.benchmark-label{font-size:10px;color:#666;text-transform:uppercase}
.page-break{page-break-before:always}
</style></head><body>
<div class="header"><div><div class="logo">Threat<span>Cast</span></div><div class="meta">${session.organization.name}${session.organization.profile?.industry ? ` · ${session.organization.profile.industry}` : ''}</div></div><div><div class="badge">EXECUTIVE REPORT</div><div class="meta" style="text-align:right;margin-top:8px">${session.completedAt ? new Date(session.completedAt).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'In Progress'}</div></div></div>

<h1>${session.title}</h1>
<div class="meta">${session.difficulty} · ${session.theme || 'General'} · ${session.mode} · ${totalQ} questions</div>

<div class="exec-summary">
<h2 style="margin-top:0;border:none;padding:0">Executive Summary</h2>
<p style="font-size:14px;margin-bottom:12px">This tabletop exercise tested your team's incident response readiness against a <strong>${session.theme || 'cybersecurity'}</strong> scenario at <strong>${session.difficulty}</strong> difficulty.</p>
<div style="display:flex;align-items:center;gap:16px">
<div>Overall Risk Rating:</div><span class="risk-badge">${riskLevel} RISK</span>
<div style="color:#666;font-size:12px">${avgAcc >= 75 ? "Team demonstrated strong readiness" : avgAcc >= 50 ? "Areas for improvement identified" : "Significant gaps — remediation recommended"}</div>
</div>
</div>

<div class="stats">
<div class="stat"><div class="stat-value">${session.participants.length}</div><div class="stat-label">Participants</div></div>
<div class="stat"><div class="stat-value">${avgAcc}%</div><div class="stat-label">Avg Accuracy</div></div>
<div class="stat"><div class="stat-value">${avgScore}</div><div class="stat-label">Avg Score</div></div>
<div class="stat"><div class="stat-value" style="color:${riskColor}">${riskLevel}</div><div class="stat-label">Risk Level</div></div>
</div>

${scenario?.narrative ? `<h2>Scenario Overview</h2><div class="narrative">${scenario.narrative}</div>` : ''}
${mitre.length ? `<h2>MITRE ATT&CK Techniques Tested</h2><div>${mitre.map((t: string) => `<span class="mitre">${t}</span>`).join(' ')}</div>` : ''}

<h2>Individual Performance</h2>
<table><thead><tr><th>Participant</th><th>Score</th><th>Correct</th><th>Accuracy</th></tr></thead><tbody>
${session.participants.sort((a, b) => b.totalScore - a.totalScore).map((p, i) => {
  const correct = p.answers.filter(a => a.isCorrect).length;
  const acc = p.answers.length > 0 ? Math.round((correct / p.answers.length) * 100) : 0;
  return `<tr><td>${i === 0 ? '🏆 ' : ''}${p.user.firstName || ''} ${p.user.lastName || ''}</td><td>${p.totalScore}</td><td>${correct}/${p.answers.length}</td><td>${acc}%</td></tr>`;
}).join('')}
</tbody></table>

<div class="page-break"></div>
<h2>Recommendations</h2>
<table><thead><tr><th>Priority</th><th>Action</th><th>Timeline</th></tr></thead><tbody>
<tr><td>🔴 HIGH</td><td>Review questions with lowest accuracy rates — target training to weakest areas</td><td>1 week</td></tr>
<tr><td>🟡 MEDIUM</td><td>Update incident response playbooks based on gaps identified in this exercise</td><td>2 weeks</td></tr>
<tr><td>🟡 MEDIUM</td><td>Schedule follow-up exercise in 30 days to measure improvement</td><td>30 days</td></tr>
<tr><td>🟢 LOW</td><td>Brief senior leadership on exercise outcomes and improvement trajectory</td><td>1 week</td></tr>
${avgAcc < 60 ? '<tr><td>🔴 HIGH</td><td>Consider additional team training on incident response fundamentals</td><td>2 weeks</td></tr>' : ''}
</tbody></table>

<h2>Compliance Evidence</h2>
<p style="font-size:13px;color:#666">This exercise serves as evidence of cyber readiness testing for the following frameworks:</p>
<table><thead><tr><th>Framework</th><th>Control</th><th>Status</th></tr></thead><tbody>
<tr><td>ISO 27001</td><td>A.16.1 — Incident management</td><td>✅ Evidenced</td></tr>
<tr><td>NIST CSF</td><td>RS.RP-1 — Response plan execution</td><td>✅ Evidenced</td></tr>
<tr><td>SOC 2</td><td>CC7.4 — Incident response</td><td>✅ Evidenced</td></tr>
<tr><td>NIS2</td><td>Art 21(2)(b) — Incident handling</td><td>✅ Evidenced</td></tr>
<tr><td>DORA</td><td>Art 11 — ICT response & recovery</td><td>✅ Evidenced</td></tr>
</tbody></table>

<div class="footer">Generated by ThreatCast · ${new Date().toLocaleDateString('en-GB')} · threatcast.io<br>This report is confidential and intended for ${session.organization.name} only.</div>
</body></html>`;

  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
