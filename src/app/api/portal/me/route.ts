export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";

export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    orgId: user.orgId,
  });
}
