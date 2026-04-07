export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-helpers";

export async function GET() {
  const user = await getAuthUser();
  if (!user || user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const hasKey = !!process.env.RESEND_API_KEY;
  const keyPrefix = process.env.RESEND_API_KEY?.slice(0, 8) || "NOT SET";

  if (!hasKey) {
    return NextResponse.json({ error: "RESEND_API_KEY not set in Vercel env vars", hasKey: false });
  }

  // Try sending a test email
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "ThreatCast <noreply@threatcast.io>",
        to: [user.email],
        subject: "ThreatCast Email Test",
        html: "<p>If you see this, email delivery is working.</p>",
      }),
    });

    const data = await res.json();
    return NextResponse.json({
      hasKey: true, keyPrefix,
      resendStatus: res.status,
      resendResponse: data,
      sentTo: user.email,
    });
  } catch (e: any) {
    return NextResponse.json({
      hasKey: true, keyPrefix,
      error: e?.message || "Network error",
    });
  }
}
