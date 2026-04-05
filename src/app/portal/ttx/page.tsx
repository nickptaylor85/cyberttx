"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Session {
  id: string;
  title: string;
  theme: string;
  difficulty: string;
  mode: string;
  status: string;
  createdAt: string;
  completedAt: string | null;
  createdBy: { firstName: string | null; lastName: string | null };
  _count: { participants: number };
}

export default function TtxListPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => { fetchSessions(); }, []);

  async function fetchSessions() {
    const res = await fetch("/api/portal/sessions");
    if (res.ok) setSessions(await res.json());
    setLoading(false);
  }

  async function deleteSession(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(id);
    await fetch(`/api/ttx/session/${id}`, { method: "DELETE" });
    setSessions((prev) => prev.filter((s) => s.id !== id));
    setDeleting(null);
  }

  async function deleteAll(status: string) {
    const toDelete = sessions.filter((s) => s.status === status);
    if (!confirm(`Delete ${toDelete.length} ${status.toLowerCase()} sessions?`)) return;
    for (const s of toDelete) {
      await fetch(`/api/ttx/session/${s.id}`, { method: "DELETE" });
    }
    setSessions((prev) => prev.filter((s) => s.status !== status));
  }

  const live = sessions.filter((s) => s.status === "IN_PROGRESS" || s.status === "LOBBY");
  const generating = sessions.filter((s) => s.status === "GENERATING");
  const completed = sessions.filter((s) => s.status === "COMPLETED");
  const cancelled = sessions.filter((s) => s.status === "CANCELLED");

  function statusBadge(status: string) {
    return cn("cyber-badge text-[10px] sm:text-xs",
      status === "IN_PROGRESS" ? "bg-green-500/20 text-green-400 border-green-500/30" :
      status === "COMPLETED" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
      status === "LOBBY" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
      status === "GENERATING" ? "bg-purple-500/20 text-purple-400 border-purple-500/30" :
      "bg-gray-500/20 text-gray-400 border-gray-500/30"
    );
  }

  if (loading) return <div className="text-center py-20 text-gray-500">Loading exercises...</div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-white">Exercises</h1>
          <p className="text-gray-500 text-sm mt-1">{sessions.length} total</p>
        </div>
        <Link href="/portal/ttx/new" className="cyber-btn-primary text-center">🎯 New Exercise</Link>
      </div>

      {/* Live Sessions */}
      {live.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Live Now
          </h2>
          <div className="space-y-2">
            {live.map((s) => (
              <div key={s.id} className="cyber-card p-4 flex items-center justify-between gap-3 border-green-500/20">
                <Link href={`/portal/ttx/${s.id}`} className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">{s.title}</p>
                  <p className="text-gray-500 text-xs mt-0.5 truncate">
                    {s.difficulty} · {s.mode === "GROUP" ? "👥" : "👤"} · {s._count.participants}p
                  </p>
                </Link>
                <Link href={`/portal/ttx/${s.id}`} className="cyber-btn-primary text-xs py-1.5 px-3 flex-shrink-0">
                  Join
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generating */}
      {generating.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-3">Generating</h2>
          {generating.map((s) => (
            <div key={s.id} className="cyber-card p-4 flex items-center justify-between gap-3 border-purple-500/20">
              <div className="flex items-center gap-3 min-w-0">
                <svg className="animate-spin h-4 w-4 text-purple-400 flex-shrink-0" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <div className="min-w-0">
                  <p className="text-white font-medium text-sm truncate">Generating scenario...</p>
                  <p className="text-gray-500 text-xs">{s.theme} · {s.difficulty}</p>
                </div>
              </div>
              <button onClick={() => deleteSession(s.id, "Generating")} className="text-gray-500 hover:text-red-400 p-1 flex-shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Completed */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Completed ({completed.length})
          </h2>
          {completed.length > 1 && (
            <button onClick={() => deleteAll("COMPLETED")} className="text-gray-600 hover:text-red-400 text-xs">
              Delete all completed
            </button>
          )}
        </div>
        {completed.length === 0 && sessions.length === 0 && (
          <div className="cyber-card text-center py-12">
            <p className="text-3xl mb-2">🎯</p>
            <p className="text-gray-400 mb-3 text-sm">No exercises yet</p>
            <Link href="/portal/ttx/new" className="cyber-btn-primary text-sm">Launch Your First TTX</Link>
          </div>
        )}
        <div className="space-y-2">
          {completed.map((s) => (
            <div key={s.id} className="cyber-card p-4 flex items-center gap-3">
              <Link href={`/portal/ttx/${s.id}`} className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">{s.title}</p>
                <p className="text-gray-500 text-xs mt-0.5">
                  {s.difficulty} · {s.theme} · {s._count.participants}p ·{" "}
                  {s.completedAt ? new Date(s.completedAt).toLocaleDateString() : ""}
                </p>
              </Link>
              <span className={statusBadge(s.status)}>Done</span>
              <button
                onClick={() => deleteSession(s.id, s.title)}
                disabled={deleting === s.id}
                className="text-gray-600 hover:text-red-400 p-1.5 rounded-lg hover:bg-surface-3 transition-colors flex-shrink-0"
              >
                {deleting === s.id ? (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Cancelled */}
      {cancelled.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Cancelled ({cancelled.length})
            </h2>
            <button onClick={() => deleteAll("CANCELLED")} className="text-gray-600 hover:text-red-400 text-xs">
              Clear all
            </button>
          </div>
          <div className="space-y-2">
            {cancelled.map((s) => (
              <div key={s.id} className="cyber-card p-3 flex items-center gap-3 opacity-60">
                <div className="flex-1 min-w-0">
                  <p className="text-gray-400 text-sm truncate">{s.title}</p>
                  <p className="text-gray-600 text-xs">{s.theme} · {s.difficulty}</p>
                </div>
                <button
                  onClick={() => deleteSession(s.id, s.title)}
                  className="text-gray-600 hover:text-red-400 p-1 flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
