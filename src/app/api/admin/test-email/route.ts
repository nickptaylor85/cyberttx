export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return NextResponse.json({ status: "BROKEN", reason: "RESEND_API_KEY not set" });

  // Check domains
  let domains;
  try {
    const dRes = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${key}` },
    });
    domains = await dRes.json();
  } catch (e: any) { domains = { error: e?.message }; }

  // Send test
  let sendResult;
  try {
    const sRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "ThreatCast <noreply@threatcast.io>",
        to: ["nickptaylor85@gmail.com"],
        subject: "ThreatCast Test — " + new Date().toLocaleTimeString(),
        html: "<p>If you see this in your inbox, email is working.</p>",
      }),
    });
    sendResult = { status: sRes.status, data: await sRes.json() };
  } catch (e: any) { sendResult = { error: e?.message }; }

  return NextResponse.json({ domains, sendResult, keyPrefix: key.slice(0, 10) });
}
