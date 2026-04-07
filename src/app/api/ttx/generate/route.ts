export const maxDuration = 300;
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { checkExerciseLimit } from "@/lib/plan-limits";
import { generateTtxScenario } from "@/lib/ai/generate-ttx";
import { generateChannelName } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await db.organization.findUnique({
    where: { id: user.orgId },
    include: { securityTools: { include: { tool: true } }, profile: true },
  });
  if (!org) return NextResponse.json({ error: "Org not found" }, { status: 404 });

  if (org.ttxUsedThisMonth >= org.maxTtxPerMonth && !org.isDemo) {
    return NextResponse.json({ error: "Monthly limit reached." }, { status: 429 });
  }

  // Clean up stuck GENERATING sessions older than 5 minutes
  await db.ttxSession.updateMany({
    where: {
      createdById: user.id,
      status: "GENERATING",
      createdAt: { lt: new Date(Date.now() - 5 * 60 * 1000) },
    },
    data: { status: "CANCELLED" },
  });

  const pendingCount = await db.ttxSession.count({
    where: { createdById: user.id, status: "GENERATING" },
  });
  if (pendingCount > 0) {
    return NextResponse.json({ error: "Already generating a scenario. Please wait." }, { status: 429 });
  }

  const body = await req.json();
  const { theme, difficulty, mode, questionCount, mitreAttackIds, selectedCharacters, customIncident, language } = body;

  const characters = (selectedCharacters || []).map((c: any) => ({
    name: c.name, role: c.role, department: c.department || undefined,
    description: c.description || undefined, expertise: c.expertise || [],
  }));

  // Plan enforcement
  const planCheck = await checkExerciseLimit(org.id);
  if (!planCheck.allowed) {
    return NextResponse.json({ error: `Monthly exercise limit reached (${planCheck.used}/${planCheck.limit}). Upgrade your plan for more.` }, { status: 429 });
  }

  const session = await db.ttxSession.create({
    data: {
      orgId: org.id, title: "Generating...", difficulty, theme,
      mitreAttackIds: mitreAttackIds || [], mode: mode || "GROUP",
      status: "GENERATING", questionCount: questionCount || 12,
      createdById: user.id, channelName: null,
    },
  });

  // Run Claude in the background using Vercel's waitUntil
  // This keeps the serverless function alive after the response is sent
  waitUntil(
    (async () => {
      try {
        console.log(`[generate] Starting background generation for session ${session.id}`);
        // Get recent scenario titles so AI never repeats
      const recentSessions = await db.ttxSession.findMany({
        where: { orgId: org.id, status: "COMPLETED" },
        select: { title: true, scenario: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      });
      const recentTitles = recentSessions.map(s => s.title).filter(Boolean);

      const scenario = await generateTtxScenario({
          theme, difficulty, mitreAttackIds: mitreAttackIds || [],
          securityTools: org.securityTools.map(ost => ({
            name: ost.tool.name, vendor: ost.tool.vendor, category: ost.tool.category,
          })),
          questionCount: questionCount || 12,
          orgProfile: org.profile as any, characters, pastPerformance: await (async () => { try { const { analyzePastPerformance } = await import("@/lib/ai/generate-ttx"); return analyzePastPerformance(org.id, db); } catch { return null; } })(), customIncident, recentTitles, language: language || "en",
        });

        await db.ttxSession.update({
          where: { id: session.id },
          data: {
            title: scenario.title, scenario: scenario as any,
            status: mode === "INDIVIDUAL" ? "IN_PROGRESS" : "LOBBY",
            channelName: generateChannelName(session.id),
          },
        });

        await db.ttxParticipant.create({ data: { sessionId: session.id, userId: user.id } });
        await db.organization.update({ where: { id: org.id }, data: { ttxUsedThisMonth: { increment: 1 } } });
        console.log(`[generate] Session ${session.id} completed: ${scenario.title}`);

        // Email user that scenario is ready
        if (process.env.RESEND_API_KEY && user.email) {
          fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: "ThreatCast <onboarding@resend.dev>",
              to: [user.email],
              subject: `Your "${scenario.title}" exercise is ready`,
              html: `<div style="font-family:-apple-system,sans-serif;max-width:500px;margin:0 auto;padding:40px 20px;"><div style="font-size:20px;font-weight:700;margin-bottom:24px;">Threat<span style="color:#14b89a;">Cast</span></div><h2>Your exercise is ready!</h2><p>Your <strong>${scenario.title}</strong> tabletop exercise has been generated.</p><a href="https://threatcast.io/portal/ttx/${session.id}" style="display:inline-block;background:#14b89a;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">Launch Exercise →</a></div>`,
            }),
          }).catch(() => {});
        }
      } catch (error: any) {
        console.error(`[generate] FAILED for session ${session.id}:`, error?.message);
        await db.ttxSession.update({ where: { id: session.id }, data: { status: "CANCELLED" } });
      }
    })()
  );

  // Return immediately
  return NextResponse.json({ id: session.id, status: "GENERATING" });
}
