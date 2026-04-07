import { db } from "@/lib/db";

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  type?: string; // e.g. "broadcast", "invite", "reset", "digest", "duel", "streak"
}

interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

async function ensureTable() {
  await db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS email_log (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    to_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    type TEXT DEFAULT 'transactional',
    status TEXT DEFAULT 'sent',
    message_id TEXT,
    error TEXT,
    from_address TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  )`);
}

export async function sendEmail(opts: SendEmailOptions): Promise<SendResult> {
  const { to, subject, html, from, type } = opts;
  const toList = Array.isArray(to) ? to : [to];
  const fromAddress = from || "ThreatCast <noreply@threatcast.io>";

  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] No RESEND_API_KEY — email not sent:", subject);
    return { success: false, error: "RESEND_API_KEY not configured" };
  }

  try {
    await ensureTable();
  } catch {}

  const results: SendResult[] = [];

  for (const recipient of toList) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: fromAddress, to: [recipient], subject, html }),
      });

      const data = await res.json();

      if (res.ok && data.id) {
        // Log success
        try {
          await db.$executeRawUnsafe(
            `INSERT INTO email_log (to_email, subject, type, status, message_id, from_address) VALUES ($1, $2, $3, 'sent', $4, $5)`,
            recipient, subject, type || "transactional", data.id, fromAddress
          );
        } catch {}
        results.push({ success: true, messageId: data.id });
      } else {
        const errorMsg = data.message || data.error || `HTTP ${res.status}`;
        // Log failure
        try {
          await db.$executeRawUnsafe(
            `INSERT INTO email_log (to_email, subject, type, status, error, from_address) VALUES ($1, $2, $3, 'failed', $4, $5)`,
            recipient, subject, type || "transactional", errorMsg, fromAddress
          );
        } catch {}
        console.error(`[email] Failed to send to ${recipient}:`, errorMsg);
        results.push({ success: false, error: errorMsg });
      }
    } catch (e: any) {
      const errorMsg = e?.message || "Network error";
      try {
        await db.$executeRawUnsafe(
          `INSERT INTO email_log (to_email, subject, type, status, error, from_address) VALUES ($1, $2, $3, 'failed', $4, $5)`,
          recipient, subject, type || "transactional", errorMsg, fromAddress
        );
      } catch {}
      console.error(`[email] Exception sending to ${recipient}:`, errorMsg);
      results.push({ success: false, error: errorMsg });
    }
  }

  const allSuccess = results.every(r => r.success);
  return {
    success: allSuccess,
    messageId: results[0]?.messageId,
    error: allSuccess ? undefined : results.filter(r => !r.success).map(r => r.error).join("; "),
  };
}

// Batch send — sends to multiple recipients with same content
export async function sendEmailBatch(
  recipients: { email: string; firstName?: string }[],
  subject: string,
  htmlTemplate: string,
  opts?: { from?: string; type?: string }
): Promise<{ sent: number; failed: number }> {
  let sent = 0, failed = 0;

  for (const r of recipients) {
    const personalised = htmlTemplate
      .replace(/\{\{name\}\}/g, r.firstName || "there")
      .replace(/\{\{email\}\}/g, r.email);

    const result = await sendEmail({
      to: r.email, subject, html: personalised,
      from: opts?.from, type: opts?.type,
    });

    if (result.success) sent++;
    else failed++;
  }

  return { sent, failed };
}
