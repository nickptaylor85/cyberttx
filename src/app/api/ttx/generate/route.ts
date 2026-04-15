export const maxDuration = 10;
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { checkExerciseLimit } from "@/lib/plan-limits";

// Fast endpoint — creates session and returns ID in <1 second.
// Generation is triggered by the SESSION PAGE calling /api/ttx/run.

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rl = rateLimit("generate:" + user.id, 10, 60 * 60 * 1000);
    if (!rl.allowed) return NextResponse.json({ error: "Rate limit exceeded." }, { status: 429 });

    const org = await db.organization.findUnique({ where: { id: user.orgId } });
    if (!org) return NextResponse.json({ error: "Org not found" }, { status: 404 });

    const planCheck = await checkExerciseLimit(org.id);
    if (!planCheck.allowed) {
      return NextResponse.json({ error: "Monthly limit reached (" + planCheck.used + "/" + planCheck.limit + ")." }, { status: 429 });
    }

    await db.ttxSession.updateMany({
      where: { createdById: user.id, status: "GENERATING", createdAt: { lt: new Date(Date.now() - 5 * 60 * 1000) } },
      data: { status: "CANCELLED" },
    });

    const body = await req.json();
    const { theme, difficulty, mode, questionCount, mitreAttackIds } = body;

    const session = await db.ttxSession.create({
      data: {
        orgId: org.id, title: "Generating...", difficulty, theme,
        mitreAttackIds: mitreAttackIds || [], mode: mode || "GROUP",
        status: "GENERATING", questionCount: questionCount || 12,
        createdById: user.id, channelName: null,
      },
    });

    return NextResponse.json({ id: session.id, status: "GENERATING" });
  } catch (error: any) {
    console.error("[generate] CRASH:", error?.message);
    return NextResponse.json({ error: error?.message || "Failed" }, { status: 500 });
  }
}
