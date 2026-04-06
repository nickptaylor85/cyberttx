"use client";
import { useState, useEffect } from "react";

interface Ticket { id: string; message: string; admin_reply: string | null; status: string; created_at: string; }

export default function SupportWidget() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [tab, setTab] = useState<"new" | "history">("new");

  useEffect(() => {
    if (open) fetch("/api/support").then(r => r.ok ? r.json() : []).then(setTickets).catch(() => {});
  }, [open]);

  async function send() {
    if (!message.trim()) return;
    setSending(true);
    await fetch("/api/support", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message }) }).catch(() => {});
    setSending(false); setMessage(""); setTab("history");
    fetch("/api/support").then(r => r.ok ? r.json() : []).then(setTickets).catch(() => {});
  }

  const hasReplies = tickets.some(t => t.admin_reply);

  return (
    <>
      <button onClick={() => setOpen(!open)} className="fixed bottom-4 right-4 z-50 w-12 h-12 rounded-full bg-cyber-600 text-white flex items-center justify-center shadow-lg shadow-cyber-900/50 hover:bg-cyber-500 transition-colors">
        {hasReplies && !open && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />}
        {open ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg> : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>}
      </button>
      {open && (
        <div className="fixed bottom-20 right-4 z-50 w-80 bg-surface-1 border border-surface-3 rounded-xl shadow-2xl overflow-hidden">
          <div className="bg-cyber-600 p-4"><p className="text-white font-semibold text-sm">ThreatCast Support</p></div>
          <div className="flex border-b border-surface-3">
            <button onClick={() => setTab("new")} className={`flex-1 py-2 text-xs ${tab === "new" ? "text-cyber-400 border-b-2 border-cyber-400" : "text-gray-500"}`}>New Message</button>
            <button onClick={() => setTab("history")} className={`flex-1 py-2 text-xs ${tab === "history" ? "text-cyber-400 border-b-2 border-cyber-400" : "text-gray-500"}`}>My Tickets {tickets.length > 0 ? `(${tickets.length})` : ""}</button>
          </div>
          <div className="p-4 max-h-64 overflow-y-auto">
            {tab === "new" ? <>
              <textarea className="cyber-input w-full h-20 resize-none text-sm" placeholder="Describe your issue..." value={message} onChange={e => setMessage(e.target.value)} />
              <button onClick={send} disabled={!message.trim() || sending} className="cyber-btn-primary text-xs mt-2 w-full disabled:opacity-50">{sending ? "Sending..." : "Send"}</button>
            </> : tickets.length === 0 ? <p className="text-gray-500 text-xs text-center py-4">No tickets yet</p> :
              <div className="space-y-2">{tickets.map(t => (
                <div key={t.id} className="border-b border-surface-3/50 pb-2 last:border-0">
                  <p className="text-white text-xs">{t.message}</p>
                  <p className="text-gray-600 text-xs">{new Date(t.created_at).toLocaleDateString("en-GB")} · {t.status}</p>
                  {t.admin_reply && (
                    <div className="mt-1.5 p-2 rounded bg-cyan-500/10 border border-cyan-500/20">
                      <p className="text-cyan-400 text-xs font-semibold">ThreatCast replied:</p>
                      <p className="text-gray-300 text-xs">{t.admin_reply}</p>
                    </div>
                  )}
                </div>
              ))}</div>
            }
          </div>
        </div>
      )}
    </>
  );
}
