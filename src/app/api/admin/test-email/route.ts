export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";

export async function GET() {
  const user = await getAuthUser();
  const hasKey = !!process.env.RESEND_API_KEY;
  const keyPrefix = process.env.RESEND_API_KEY?.slice(0, 8) || "NOT SET";
  const userEmail = user?.email || "unknown";
  const userRole = user?.role || "none";

  if (!hasKey) {
    return NextResponse.json({ status: "BROKEN", reason: "RESEND_API_KEY not set in Vercel", hasKey: false, user: userEmail, role: userRole });
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "ThreatCast <noreply@threatcast.io>",
        to: [userEmail],
        subject: "ThreatCast Email Test — " + new Date().toISOString(),
        html: "<h2>Email delivery is working!</h2><p>If you see this, Resend + threatcast.io domain verification is confirmed.</p>",
      }),
    });
    const data = await res.json();
    return NextResponse.json({ status: res.ok ? "SENT" : "FAILED", hasKey: true, keyPrefix, user: userEmail, role: userRole, resendHttpStatus: res.status, resendResponse: data });
  } catch (e: any) {
    return NextResponse.json({ status: "ERROR", hasKey: true, keyPrefix, error: e?.message, user: userEmail, role: userRole });
  }
}
