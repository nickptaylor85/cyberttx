"use client";
import { useState } from "react";

export default function AdminInviteForm({ orgId, orgName }: { orgId: string; orgName: string }) {
  const [emails, setEmails] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function send() {
    setSending(true); setResult(null);
    const list = emails.split(/[,\n]/).map(e => e.trim()).filter(Boolean);
    const res = await fetch("/api/admin/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgId, emails: list }),
    });
    setResult(await res.json());
    setSending(false); setEmails("");
  }

  return (
    <div className="cyber-card mb-4 border-cyber-600/30">
      <h3 className="text-white text-sm font-semibold mb-2">Invite Users to {orgName}</h3>
      <p className="text-gray-500 text-xs mb-3">Invited users will be linked to this portal when they sign up. First user becomes Portal Admin.</p>
      <div className="flex gap-2">
        <input
          className="cyber-input flex-1 text-sm"
          placeholder="email@company.com, another@company.com"
          value={emails}
          onChange={e => setEmails(e.target.value)}
        />
        <button
          onClick={send}
          disabled={sending || !emails.trim()}
          className="cyber-btn-primary text-sm whitespace-nowrap disabled:opacity-50"
        >
          {sending ? "Sending..." : "Send Invites"}
        </button>
      </div>
      {result && (
        <div className="mt-2">
          {result.sent > 0 && <p className="text-green-400 text-xs">{result.sent} invitation{result.sent !== 1 ? "s" : ""} sent</p>}
          {result.results?.filter((r: any) => r.status === "already_member").length > 0 && (
            <p className="text-yellow-400 text-xs">{result.results.filter((r: any) => r.status === "already_member").length} already members</p>
          )}
        </div>
      )}
    </div>
  );
}
