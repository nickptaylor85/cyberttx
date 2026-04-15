export const maxDuration = 300;
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { checkExerciseLimit } from "@/lib/plan-limits";
import { generateTtxScenario, analyzePastPerformance } from "@/lib/ai/generate-ttx";
import { generateChannelName } from "@/lib/utils";
import { getOrgAIProvider } from "@/lib/ai/get-org-provider";

// ═══════════════════════════════════════════════════════════════
// STREAMING SYNCHRONOUS GENERATION
// ═══════════════════════════════════════════════════════════════
// Returns a text/event-stream that sends keepalive pings every 5s.
// Mobile browsers kill idle connections after ~30s. This keeps it alive.
// When AI completes (~60-90s), sends the result and closes.
//
// Client reads the stream, ignores pings, parses the final JSON line.
// No after(). No /run. No fire-and-forget. No background tasks.
// The function stays alive because the RESPONSE STREAM is open.
// ═══════════════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  // Auth + validation (fast, ~200ms)
  const user = await getAuthUser();
  if (!user?.orgId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

  const rl = rateLimit("generate:" + user.id, 10, 60 * 60 * 1000);
  if (!rl.allowed) return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429 });

  const org = await db.organization.findUnique({
    where: { id: user.orgId },
    include: { securityTools: { include: { tool: true } }, profile: true },
  });
  if (!org) return new Response(JSON.stringify({ error: "Org not found" }), { status: 404 });

  const planCheck = await checkExerciseLimit(org.id);
  if (!planCheck.allowed) {
    return new Response(JSON.stringify({ error: "Monthly limit reached (" + planCheck.used + "/" + planCheck.limit + ")." }), { status: 429 });
  }

  await db.ttxSession.updateMany({
    where: { createdById: user.id, status: "GENERATING", createdAt: { lt: new Date(Date.now() - 5 * 60 * 1000) } },
    data: { status: "CANCELLED" },
  });

  const body = await req.json();
  const { theme, difficulty, mode, questionCount, mitreAttackIds, selectedCharacters, customIncident, language } = body;

  const session = await db.ttxSession.create({
    data: {
      orgId: org.id, title: "Generating...", difficulty, theme,
      mitreAttackIds: mitreAttackIds || [], mode: mode || "GROUP",
      status: "GENERATING", questionCount: questionCount || 12,
      createdById: user.id, channelName: null,
    },
  });

  // Return a streaming response with keepalive pings
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Send keepalive pings every 5 seconds to prevent browser timeout
      const pingInterval = setInterval(() => {
        try { controller.enqueue(encoder.encode("data: {\"ping\":true}\n\n")); } catch {}
      }, 5000);

      try {
        console.log("[generate] Starting session=" + session.id + " theme=" + theme);
        const startTime = Date.now();

        controller.enqueue(encoder.encode("data: {\"status\":\"connecting\"}\n\n"));

        const recentSessions = await db.ttxSession.findMany({
          where: { orgId: org.id, status: "COMPLETED" },
          select: { title: true },
          orderBy: { createdAt: "desc" },
          take: 10,
        });

        let pastPerformance = null;
        try { pastPerformance = await analyzePastPerformance(org.id, db); } catch {}

        const providerConfig = await getOrgAIProvider(org.id);
        const isDefault = providerConfig.provider === "anthropic" && providerConfig.apiKey === process.env.ANTHROPIC_API_KEY;

        controller.enqueue(encoder.encode("data: {\"status\":\"generating\"}\n\n"));

        const scenario = await generateTtxScenario({
          theme, difficulty,
          mitreAttackIds: mitreAttackIds || [],
          securityTools: org.securityTools.map((ost: any) => ({
            name: ost.tool.name, vendor: ost.tool.vendor, category: ost.tool.category,
          })),
          questionCount: questionCount || 12,
          orgProfile: (org.profile || null) as any,
          orgName: org.name,
          characters: (selectedCharacters || []).map((c: any) => ({
            name: c.name, role: c.role, department: c.department || undefined,
            description: c.description || undefined, expertise: c.expertise || [],
          })),
          pastPerformance,
          customIncident,
          recentTitles: recentSessions.map((s: any) => s.title).filter(Boolean),
          language: language || "en",
          providerConfig: isDefault ? undefined : providerConfig,
        });

        controller.enqueue(encoder.encode("data: {\"status\":\"saving\"}\n\n"));

        const sessionMode = mode || "GROUP";
        await db.ttxSession.update({
          where: { id: session.id },
          data: {
            title: scenario.title,
            scenario: scenario as any,
            status: sessionMode === "INDIVIDUAL" ? "IN_PROGRESS" : "LOBBY",
            channelName: generateChannelName(session.id),
          },
        });

        await db.ttxParticipant.create({ data: { sessionId: session.id, userId: user.id } });
        await db.organization.update({ where: { id: org.id }, data: { ttxUsedThisMonth: { increment: 1 } } });

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log("[generate] SUCCESS in " + elapsed + "s: " + scenario.title);

        // Send final result
        controller.enqueue(encoder.encode("data: " + JSON.stringify({ done: true, id: session.id, status: "READY" }) + "\n\n"));

        // Fire-and-forget email
        if (process.env.RESEND_API_KEY && user.email) {
          fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: "Bearer " + process.env.RESEND_API_KEY, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: "ThreatCast <noreply@threatcast.io>",
              to: [user.email],
              subject: "Your exercise is ready: " + scenario.title,
              html: '<div style="font-family:-apple-system,sans-serif;max-width:500px;margin:0 auto;padding:40px 20px;"><h2>Your exercise is ready!</h2><p><strong>' + scenario.title + '</strong></p><a href="https://threatcast.io/portal/ttx/' + session.id + '" style="display:inline-block;background:#14b89a;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">Launch Exercise</a></div>',
            }),
          }).catch(() => {});
        }
      } catch (error: any) {
        console.error("[generate] FAILED:", error?.message, error?.stack?.substring(0, 500));
        await db.ttxSession.update({ where: { id: session.id }, data: { status: "CANCELLED" } }).catch(() => {});
        controller.enqueue(encoder.encode("data: " + JSON.stringify({ done: true, error: error?.message || "Generation failed" }) + "\n\n"));
      } finally {
        clearInterval(pingInterval);
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
