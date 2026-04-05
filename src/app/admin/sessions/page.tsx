"use client";
import { useState, useEffect } from "react";

interface Session {
  id: string; title: string; status: string; theme: string; difficulty: string;
  createdAt: string; completedAt: string | null;
  organization: { name: string } | null;
  createdBy: { firstName: string | null; email: string } | null;
  _count: { participants: number };
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/portal/sessions?admin=true");
    if (res.ok) setSessions(await res.json());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function deleteSession(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This removes all answers, participants, and playbooks.`)) return;
    const res = await fetch(`/api/admin/sessions?id=${id}`, { method: "DELETE" });
    if (res.ok) setSessions(s => s.filter(x => x.id !== id));
  }

  async function bulkDelete(status: string) {
    const count = sessions.filter(s => s.status === status).length;
    if (!confirm(`Delete ALL ${count} ${status} sessions? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/sessions?status=${status}`, { method: "DELETE" });
    if (res.ok) setSessions(s => s.filter(x => x.status !== status));
  }

  const cancelled = sessions.filter(s => s.status === "CANCELLED").length;
  const generating = sessions.filter(s => s.status === "GENERATING").length;
  const sc: Record<string, string> = {
    COMPLETED: "bg-green-500/20 text-green-400", IN_PROGRESS: "bg-blue-500/20 text-blue-400",
    LOBBY: "bg-purple-500/20 text-purple-400", GENERATING: "bg-yellow-500/20 text-yellow-400",
    CANCELLED: "bg-red-500/20 text-red-400",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="font-display text-xl sm:text-2xl font-bold text-white">All Sessions</h1><p className="text-gray-500 text-xs sm:text-sm mt-1">{sessions.length} total</p></div>
        <div className="flex gap-2">
          {cancelled > 0 && <button onClick={() => bulkDelete("CANCELLED")} className="cyber-btn-danger text-xs">Delete {cancelled} Cancelled</button>}
          {generating > 0 && <button onClick={() => bulkDelete("GENERATING")} className="cyber-btn-danger text-xs">Delete {generating} Stuck</button>}
        </div>
      </div>

      {loading ? <p className="text-gray-500 text-center py-12">Loading...</p> :
        <div className="space-y-2">{sessions.map(s => (
          <div key={s.id} className="cyber-card">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1 mr-3">
                <p className="text-white text-sm font-medium truncate">{s.title}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-gray-500 text-xs">{s.organization?.name || "Unknown"}</span>
                  <span className="text-gray-600 text-xs">·</span>
                  <span className="text-gray-500 text-xs">{s.createdBy?.firstName || s.createdBy?.email || "Unknown"}</span>
                  <span className="text-gray-600 text-xs">·</span>
                  <span className="text-gray-500 text-xs">{s.theme}</span>
                  <span className="text-gray-600 text-xs">·</span>
                  <span className="text-gray-500 text-xs">{s._count.participants} players</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`cyber-badge text-xs ${sc[s.status] || "bg-surface-3 text-gray-400"}`}>{s.status}</span>
                <button onClick={() => deleteSession(s.id, s.title)} className="p-1.5 rounded hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors" title="Delete">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          </div>
        ))}</div>
      }
    </div>
  );
}
