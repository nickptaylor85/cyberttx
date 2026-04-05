"use client";
import { useState } from "react";
export default function InviteForm() {
  const [emails, setEmails] = useState(""); const [sending, setSending] = useState(false); const [result, setResult] = useState<any>(null);
  async function send() {
    setSending(true); setResult(null);
    const list = emails.split(/[,\n]/).map(e => e.trim()).filter(Boolean);
    const res = await fetch("/api/portal/invite", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ emails: list }) });
    setResult(await res.json()); setSending(false); setEmails("");
  }
  return (
    <div className="cyber-card">
      <h3 className="font-display text-sm font-semibold text-white mb-2">Invite Team Members</h3>
      <div className="flex gap-2"><input className="cyber-input flex-1" placeholder="email@company.com, another@company.com" value={emails} onChange={e => setEmails(e.target.value)} /><button onClick={send} disabled={sending || !emails.trim()} className="cyber-btn-primary text-sm whitespace-nowrap disabled:opacity-50">{sending ? "Sending..." : "Send Invites"}</button></div>
      {result && <p className="text-green-400 text-xs mt-2">{result.sent} invitation{result.sent !== 1 ? "s" : ""} sent</p>}
    </div>
  );
}
