"use client";
import { useState, useEffect } from "react";

interface Ticket { id: string; user_email: string; user_name: string; org_name: string; message: string; status: string; created_at: string; resolved_at: string | null; }

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadTickets(); }, []);

  async function loadTickets() {
    try {
      const res = await fetch("/api/support");
      if (res.ok) setTickets(await res.json());
    } catch {}
    setLoading(false);
  }

  async function resolve(id: string) {
    await fetch("/api/support", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: "resolved" }) });
    loadTickets();
  }

  async function reopen(id: string) {
    await fetch("/api/support", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: "open" }) });
    loadTickets();
  }

  async function remove(id: string) {
    if (!confirm("Delete this ticket?")) return;
    await fetch(`/api/support?id=${id}`, { method: "DELETE" });
    loadTickets();
  }

  const open = tickets.filter(t => t.status !== "resolved");
  const resolved = tickets.filter(t => t.status === "resolved");

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl sm:text-2xl font-bold text-white">Support Tickets</h1><p className="text-gray-500 text-xs mt-1">{open.length} open · {resolved.length} resolved</p></div>

      {loading ? <p className="text-gray-500 text-center py-8">Loading...</p> :
        tickets.length === 0 ? (
          <div className="cyber-card text-center py-12">
            <p className="text-3xl mb-3">📬</p>
            <p className="text-gray-400 text-sm">No support tickets</p>
            <p className="text-gray-500 text-xs mt-1">When users submit messages via the portal support widget, they&apos;ll appear here.</p>
          </div>
        ) : <>
          {open.length > 0 && (
            <div className="mb-6">
              <h2 className="text-yellow-400 text-xs font-semibold mb-2">Open ({open.length})</h2>
              <div className="space-y-2">{open.map(t => (
                <div key={t.id} className="cyber-card border-l-2 border-l-yellow-500">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white text-sm font-medium">{t.user_name}</span>
                        <span className="text-purple-400 text-xs">{t.org_name || "No portal"}</span>
                        <span className="text-gray-600 text-xs">{new Date(t.created_at).toLocaleString("en-GB")}</span>
                      </div>
                      <p className="text-gray-400 text-sm">{t.message}</p>
                      <p className="text-gray-600 text-xs mt-1">{t.user_email}</p>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <a href={`mailto:${t.user_email}?subject=Re: ThreatCast Support`} className="cyber-btn-secondary text-xs py-1 px-2">Reply</a>
                      <button onClick={() => resolve(t.id)} className="cyber-btn-primary text-xs py-1 px-2">Resolve</button>
                      <button onClick={() => remove(t.id)} className="cyber-btn-danger text-xs py-1 px-2">✕</button>
                    </div>
                  </div>
                </div>
              ))}</div>
            </div>
          )}
          {resolved.length > 0 && (
            <div>
              <h2 className="text-green-400 text-xs font-semibold mb-2">Resolved ({resolved.length})</h2>
              <div className="space-y-2">{resolved.map(t => (
                <div key={t.id} className="cyber-card opacity-60">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <span className="text-white text-xs">{t.user_name}</span>
                      <span className="text-purple-400 text-xs ml-2">{t.org_name}</span>
                      <span className="text-gray-600 text-xs ml-2">{new Date(t.created_at).toLocaleDateString("en-GB")}</span>
                      <p className="text-gray-500 text-xs mt-1">{t.message}</p>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button onClick={() => reopen(t.id)} className="cyber-btn-secondary text-xs py-1 px-2">Reopen</button>
                      <button onClick={() => remove(t.id)} className="text-gray-600 text-xs hover:text-red-400 p-1">✕</button>
                    </div>
                  </div>
                </div>
              ))}</div>
            </div>
          )}
        </>
      }
    </div>
  );
}
