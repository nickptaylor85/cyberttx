import { db } from "@/lib/db";

let tableCreated = false;
async function ensureTable() {
  if (tableCreated) return;
  try {
    await db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS email_log (id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text, to_email TEXT NOT NULL, subject TEXT NOT NULL, type TEXT DEFAULT 'transactional', status TEXT DEFAULT 'sent', message_id TEXT, error TEXT, from_address TEXT, created_at TIMESTAMP DEFAULT NOW())`);
    tableCreated = true;
  } catch {}
}

function guessType(subject: string): string {
  const s = subject.toLowerCase();
  if (s.includes("duel")) return "duel";
  if (s.includes("streak") || s.includes("training without")) return "streak";
  if (s.includes("weekly report") || s.includes("weekly digest")) return "report";
  if (s.includes("weekly challenge") || s.includes("new weekly")) return "challenge";
  if (s.includes("quick question") || s.includes("daily drill")) return "digest";
  if (s.includes("reset") || s.includes("password")) return "reset";
  if (s.includes("verify")) return "verification";
  if (s.includes("invite") || s.includes("join")) return "invite";
  return "transactional";
}

async function logEmail(to: string, subject: string, from: string, status: "sent" | "failed", messageId?: string, error?: string, type?: string) {
  try {
    await ensureTable();
    await db.$executeRawUnsafe(
      `INSERT INTO email_log (to_email, subject, type, status, message_id, error, from_address) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      to, subject, type || guessType(subject), status, messageId || null, error || null, from
    );
  } catch {}
}

// Drop-in for sendEmail — used by broadcast and duels
interface SendEmailOptions { to: string; subject: string; html: string; from?: string; type?: string; }
interface SendResult { success: boolean; messageId?: string; error?: string; }

export async function sendEmail(opts: SendEmailOptions): Promise<SendResult> {
  const fromAddr = opts.from || "ThreatCast <noreply@threatcast.io>";
  if (!process.env.RESEND_API_KEY) {
    await logEmail(opts.to, opts.subject, fromAddr, "failed", undefined, "No RESEND_API_KEY", opts.type);
    return { success: false, error: "No RESEND_API_KEY" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: fromAddr, to: [opts.to], subject: opts.subject, html: opts.html }),
    });
    const data = await res.json();
    if (res.ok && data.id) {
      await logEmail(opts.to, opts.subject, fromAddr, "sent", data.id, undefined, opts.type);
      return { success: true, messageId: data.id };
    }
    const err = data.message || `HTTP ${res.status}`;
    await logEmail(opts.to, opts.subject, fromAddr, "failed", undefined, err, opts.type);
    return { success: false, error: err };
  } catch (e: any) {
    await logEmail(opts.to, opts.subject, fromAddr, "failed", undefined, e?.message, opts.type);
    return { success: false, error: e?.message };
  }
}

// Install global interceptor — patches fetch to log all Resend API calls
// This catches ALL email sends across the entire app without modifying any files
const originalFetch = globalThis.fetch;
const patchedFetch: typeof fetch = async (input, init) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : (input as Request).url;
  
  if (url === "https://api.resend.com/emails" && init?.method === "POST" && init?.body) {
    try {
      const body = JSON.parse(init.body as string);
      const to = Array.isArray(body.to) ? body.to[0] : body.to;
      const result = await originalFetch(input, init);
      const clone = result.clone();
      const data = await clone.json().catch(() => ({}));
      
      if (result.ok && data.id) {
        await logEmail(to, body.subject || "", body.from || "", "sent", data.id);
      } else {
        await logEmail(to, body.subject || "", body.from || "", "failed", undefined, data.message || `HTTP ${result.status}`);
      }
      return result;
    } catch (e: any) {
      // Still call original fetch but log the error
      try {
        const body = JSON.parse(init.body as string);
        const to = Array.isArray(body.to) ? body.to[0] : body.to;
        await logEmail(to, body.subject || "", body.from || "", "failed", undefined, e?.message);
      } catch {}
      return originalFetch(input, init);
    }
  }
  
  return originalFetch(input, init);
};
globalThis.fetch = patchedFetch;
