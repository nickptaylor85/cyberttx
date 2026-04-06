"use client";
import { useState, useEffect } from "react";

interface Ticket { id: string; from: string; org: string; message: string; date: string; status: string; }

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("tc_support_tickets");
    if (stored) setTickets(JSON.parse(stored));
  }, []);

  function save(t: Ticket[]) { setTickets(t); localStorage.setItem("tc_support_tickets", JSON.stringify(t)); }
  function resolve(id: string) { save(tickets.map(t => t.id === id ? { ...t, status: "resolved" } : t)); }
  function remove(id: string) { save(tickets.filter(t => t.id !== id)); }

  const open = tickets.filter(t => t.status !== "resolved");
  const resolved = tickets.filter(t => t.status === "resolved");

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl sm:text-2xl font-bold text-white">Support Tickets</h1><p className="text-gray-500 text-xs mt-1">{open.length} open · {resolved.length} resolved</p></div>

      <div className="cyber-card mb-4 bg-surface-0/50">
        <p className="text-gray-500 text-xs">Support messages from the portal widget appear here. For email-based support, messages are sent to <strong className="text-gray-400">support@threatcast.io</strong>.</p>
      </div>

      {open.length === 0 && resolved.length === 0 ? (
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
                  <div><p className="text-white text-sm">{t.from}</p><p className="text-purple-400 text-xs">{t.org}</p><p className="text-gray-400 text-xs mt-1">{t.message}</p><p className="text-gray-600 text-xs mt-1">{new Date(t.date).toLocaleString("en-GB")}</p></div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button onClick={() => resolve(t.id)} className="cyber-btn-primary text-xs py-1 px-2">Resolve</button>
                    <button onClick={() => remove(t.id)} className="cyber-btn-danger text-xs py-1 px-2">Delete</button>
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
                <div className="flex items-start justify-between"><div><p className="text-white text-xs">{t.from} · {t.org}</p><p className="text-gray-500 text-xs">{t.message}</p></div>
                  <button onClick={() => remove(t.id)} className="text-gray-600 text-xs hover:text-red-400">✕</button>
                </div>
              </div>
            ))}</div>
          </div>
        )}
      </>}
    </div>
  );
}
