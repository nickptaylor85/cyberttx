"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { SkeletonList } from "@/components/Skeleton";

interface Session { id: string; title: string; status: string; theme: string; difficulty: string; createdAt: string; completedAt: string | null; _count: { participants: number } }

export default function ExercisesPage() {
  const [sessions, setSessions] = useState<Session[]>([]); const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(""); const [statusFilter, setStatusFilter] = useState("ALL"); const [themeFilter, setThemeFilter] = useState("ALL");

  useEffect(() => { fetch("/api/portal/sessions").then(r => r.json()).then(d => { setSessions(d || []); setLoading(false); }).catch(() => setLoading(false)); }, []);

  const themes = useMemo(() => [...new Set(sessions.map(s => s.theme))].sort(), [sessions]);
  const filtered = useMemo(() => sessions.filter(s => {
    if (statusFilter !== "ALL" && s.status !== statusFilter) return false;
    if (themeFilter !== "ALL" && s.theme !== themeFilter) return false;
    if (search && !s.title.toLowerCase().includes(search.toLowerCase()) && !s.theme.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [sessions, search, statusFilter, themeFilter]);

  const sc: Record<string, string> = { COMPLETED: "bg-green-500/20 text-green-400", IN_PROGRESS: "bg-blue-500/20 text-blue-400", LOBBY: "bg-purple-500/20 text-purple-400", GENERATING: "bg-yellow-500/20 text-yellow-400", CANCELLED: "bg-red-500/20 text-red-400" };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div><h1 className="font-display text-xl sm:text-2xl font-bold text-white">Exercises</h1><p className="text-gray-500 text-xs sm:text-sm mt-1">{filtered.length} of {sessions.length}</p></div>
        <Link href="/portal/ttx/new" className="cyber-btn-primary text-sm">+ New Exercise</Link>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input className="cyber-input flex-1 min-w-[150px] text-sm" placeholder="Search exercises..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="cyber-input text-sm w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="ALL">All Status</option>
          <option value="COMPLETED">Completed</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select className="cyber-input text-sm w-auto" value={themeFilter} onChange={e => setThemeFilter(e.target.value)}>
          <option value="ALL">All Themes</option>
          {themes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Joinable team exercises */}
      {!loading && filtered.filter(s => s.status === "LOBBY" || s.status === "IN_PROGRESS").length > 0 && (
        <div className="mb-6">
          <h2 className="text-green-400 text-xs font-semibold mb-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Live & Joinable
          </h2>
          <div className="space-y-2">{filtered.filter(s => s.status === "LOBBY" || s.status === "IN_PROGRESS").map(s => (
            <Link key={s.id + "-live"} href={`/portal/ttx/${s.id}`} className="cyber-card flex items-center justify-between border-green-500/20 hover:border-green-500/40 transition-colors block">
              <div className="min-w-0 mr-3"><p className="text-white text-sm font-medium truncate">{s.title}</p><p className="text-gray-500 text-xs">{s.theme} · {s._count.participants} players</p></div>
              <span className="cyber-btn-primary text-xs py-1.5 px-3 flex-shrink-0">{s.status === "LOBBY" ? "Join Lobby" : "Join Live"}</span>
            </Link>
          ))}</div>
        </div>
      )}

      {loading ? <SkeletonList count={5} /> : filtered.length === 0 ? (
        <div className="cyber-card text-center py-12"><p className="text-gray-400 text-sm">No exercises found</p><Link href="/portal/ttx/new" className="cyber-btn-primary text-sm mt-3 inline-block">Create your first exercise</Link></div>
      ) : (
        <div className="space-y-2">{filtered.map(s => (
          <Link key={s.id} href={`/portal/ttx/${s.id}`} className="cyber-card flex items-center justify-between hover:border-cyber-600/30 transition-colors block">
            <div className="min-w-0 mr-3"><p className="text-white text-sm font-medium truncate">{s.title}</p><p className="text-gray-500 text-xs mt-0.5">{s.theme} · {s.difficulty} · {s._count.participants} players · {new Date(s.createdAt).toLocaleDateString("en-GB")}</p></div>
            <span className={`cyber-badge text-xs flex-shrink-0 ${sc[s.status] || "bg-surface-3 text-gray-400"}`}>{s.status === "COMPLETED" ? "Done" : s.status === "IN_PROGRESS" ? "Live" : s.status}</span>
          </Link>
        ))}</div>
      )}
    </div>
  );
}
