export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const hasKey = !!process.env.RESEND_API_KEY;
  const keyPrefix = process.env.RESEND_API_KEY?.slice(0, 8) || "NOT SET";

  if (!hasKey) {
    return NextResponse.json({ status: "BROKEN", reason: "RESEND_API_KEY not set in Vercel env vars", hasKey: false });
  }

  // Send test to a hardcoded address
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "ThreatCast <noreply@threatcast.io>",
        to: ["nick@cyberttx.com"],
        subject: "ThreatCast Email Test — " + new Date().toISOString(),
        html: "<div style='font-family:sans-serif;padding:20px;'><h2>Email delivery test</h2><p>If you see this, Resend is working with threatcast.io domain.</p></div>",
      }),
    });

    const data = await res.json();
    return NextResponse.json({
      status: res.ok ? "OK" : "FAILED",
      hasKey: true,
      keyPrefix,
      httpStatus: res.status,
      resendResponse: data,
    });
  } catch (e: any) {
    return NextResponse.json({ status: "ERROR", hasKey: true, keyPrefix, error: e?.message });
  }
}
