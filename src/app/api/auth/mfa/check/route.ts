export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ mfaRequired: false });

  const user = await db.user.findFirst({
    where: { email: email.toLowerCase(), clerkId: { startsWith: "hash:" } },
    select: { avatarUrl: true },
  });

  return NextResponse.json({ mfaRequired: !!user?.avatarUrl?.startsWith("mfa:") });
}
