export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  // Show all registered users and their emails
  const users = await db.user.findMany({
    where: { clerkId: { startsWith: "hash:" } },
    select: { email: true, firstName: true, lastName: true, role: true, organization: { select: { name: true } } },
  });
  return NextResponse.json({ 
    users: users.map(u => ({ email: u.email, name: `${u.firstName} ${u.lastName}`, role: u.role, org: u.organization?.name })),
    note: "Broadcasts send to these email addresses. If your Gmail is different, that's why you're not receiving them."
  });
}
