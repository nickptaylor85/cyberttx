export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // Log admin access for audit trail
  if (user.role === "SUPER_ADMIN") {
    try {
      await db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS admin_access_log (id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, user_id TEXT, email TEXT, ip TEXT, path TEXT, created_at TIMESTAMP DEFAULT NOW())`);
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
      await db.$executeRawUnsafe(`INSERT INTO admin_access_log (user_id, email, ip, path) VALUES ($1, $2, $3, $4)`, user.id, user.email, ip, "/api/portal/me");
    } catch {}
  }

  return NextResponse.json({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    orgId: user.orgId,
  });
}
