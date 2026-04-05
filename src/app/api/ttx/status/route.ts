export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sessionId = req.nextUrl.searchParams.get("id");
  if (!sessionId) return NextResponse.json({ error: "No id" }, { status: 400 });

  const session = await db.ttxSession.findUnique({
    where: { id: sessionId },
    select: { id: true, status: true, title: true, orgId: true },
  });

  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // TENANT ISOLATION
  if (user.role !== "SUPER_ADMIN" && session.orgId !== user.orgId) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // Strip orgId from response
  return NextResponse.json({ id: session.id, status: session.status, title: session.title });
}
