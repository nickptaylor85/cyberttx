export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Microsoft Teams incoming webhook — send exercise results and challenges
export async function POST(req: NextRequest) {
  const { action, webhookUrl, data } = await req.json();

  if (action === "test") {
    if (!webhookUrl) return NextResponse.json({ error: "webhookUrl required" }, { status: 400 });
    const res = await fetch(webhookUrl, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ "@type": "MessageCard", summary: "ThreatCast Test", themeColor: "14b89a", title: "ThreatCast Connected! 🛡️", text: "Your Microsoft Teams integration is working. You'll receive exercise notifications here." }),
    });
    return NextResponse.json({ success: res.ok });
  }

  if (action === "notify" && webhookUrl && data) {
    await fetch(webhookUrl, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        "@type": "MessageCard", summary: "ThreatCast", themeColor: "14b89a",
        title: data.title || "ThreatCast Update",
        text: data.message || "",
        potentialAction: [{ "@type": "OpenUri", name: "Open ThreatCast", targets: [{ os: "default", uri: "https://threatcast.io/portal" }] }],
      }),
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
