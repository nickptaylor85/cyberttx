export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const hasKey = !!process.env.RESEND_API_KEY;
  if (!hasKey) return NextResponse.json({ error: "RESEND_API_KEY not set" });

  // Get the first real user email from DB
  const user = await db.user.findFirst({
    where: { clerkId: { startsWith: "hash:" }, role: "SUPER_ADMIN" },
    select: { email: true, firstName: true },
  });

  if (!user) return NextResponse.json({ error: "No admin user found in DB" });

  const results: any = { targetEmail: user.email, tests: [] };

  // Test 1: Send from threatcast.io domain
  try {
    const res1 = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "ThreatCast <noreply@threatcast.io>",
        to: [user.email],
        subject: "Test 1: From threatcast.io — " + new Date().toLocaleTimeString(),
        html: "<p>This was sent from noreply@threatcast.io. If you see this, your domain is verified.</p>",
      }),
    });
    const data1 = await res1.json();
    results.tests.push({ from: "noreply@threatcast.io", status: res1.status, response: data1 });
  } catch (e: any) {
    results.tests.push({ from: "noreply@threatcast.io", error: e.message });
  }

  // Test 2: Send from resend.dev (always works)
  try {
    const res2 = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "ThreatCast <onboarding@resend.dev>",
        to: [user.email],
        subject: "Test 2: From resend.dev — " + new Date().toLocaleTimeString(),
        html: "<p>This was sent from onboarding@resend.dev. If you see this but not Test 1, your domain needs verification.</p>",
      }),
    });
    const data2 = await res2.json();
    results.tests.push({ from: "onboarding@resend.dev", status: res2.status, response: data2 });
  } catch (e: any) {
    results.tests.push({ from: "onboarding@resend.dev", error: e.message });
  }

  return NextResponse.json(results);
}
