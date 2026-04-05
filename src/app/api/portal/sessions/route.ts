export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  const isAdmin = req.nextUrl.searchParams.get("admin") === "true";

  // Admin mode: return all sessions if SUPER_ADMIN
  if (isAdmin && user?.role === "SUPER_ADMIN") {
    const sessions = await db.ttxSession.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        organization: { select: { name: true } },
        createdBy: { select: { firstName: true, email: true } },
        _count: { select: { participants: true } },
      },
    });
    return NextResponse.json(sessions);
  }

  // Normal mode: org-scoped
  if (!user?.orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sessions = await db.ttxSession.findMany({
    where: { orgId: user.orgId },
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: { select: { firstName: true, lastName: true } },
      _count: { select: { participants: true } },
    },
  });
  return NextResponse.json(sessions);
}
