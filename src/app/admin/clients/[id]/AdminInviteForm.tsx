"use client";
import { useState, useTransition } from "react";
import { sendInvites } from "../../actions";

export default function AdminInviteForm({ orgId, orgName }: { orgId: string; orgName: string }) {
  const [emails, setEmails] = useState("");
  const [result, setResult] = useState<any>(null);
  const [isPending, startTransition] = useTransition();

  function send() {
    const list = emails.split(/[,\n]/).map(e => e.trim()).filter(Boolean);
    if (!list.length) return;
    startTransition(async () => {
      try {
        const data = await sendInvites(orgId, list);
        setResult(data);
        setEmails("");
      } catch (e: any) { setResult({ error: e.message }); }
    });
  }

  return (
    <div className="cyber-card mb-4 border-cyber-600/30">
      <h3 className="text-white text-sm font-semibold mb-2">Invite Users to {orgName}</h3>
      <p className="text-gray-500 text-xs mb-3">Invited users will receive an email with a pre-filled sign-up link. First user becomes Portal Admin.</p>
      <div className="flex gap-2">
        <input className="cyber-input flex-1 text-sm" placeholder="email@company.com, another@company.com" value={emails} onChange={e => setEmails(e.target.value)} />
        <button onClick={send} disabled={isPending || !emails.trim()} className="cyber-btn-primary text-sm whitespace-nowrap disabled:opacity-50">{isPending ? "Sending..." : "Send Invites"}</button>
      </div>
      {result && !result.error && (
        <div className="mt-2">
          {result.sent > 0 && <p className="text-green-400 text-xs">{result.sent} invitation{result.sent !== 1 ? "s" : ""} sent</p>}
          {result.results?.filter((r: any) => r.status === "already_member").length > 0 && <p className="text-yellow-400 text-xs">{result.results.filter((r: any) => r.status === "already_member").length} already members</p>}
        </div>
      )}
      {result?.error && <p className="text-red-400 text-xs mt-2">{result.error}</p>}
    </div>
  );
}
