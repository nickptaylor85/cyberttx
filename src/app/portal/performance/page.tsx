"use client";
import { useState, useEffect } from "react";

interface UserPerf { id: string; name: string; avgAcc: number; sessions: number; }
interface Benchmarks { org: { accuracy: number; exercises: number }; platform: { accuracy: number }; industry: { name: string; averageAccuracy: number }; percentile: number | null; }

export default function PerformancePage() {
  const [users, setUsers] = useState<UserPerf[]>([]); 
  const [bench, setBench] = useState<Benchmarks | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/portal/sessions").then(r => r.json()),
      fetch("/api/portal/benchmarks").then(r => r.ok ? r.json() : null),
    ]).then(([sessions, benchmarks]) => {
      setBench(benchmarks);
      // Aggregate by participant
      const userMap = new Map<string, { name: string; correct: number; total: number; sessions: number }>();
      (sessions || []).forEach((s: any) => {
        if (s.status !== "COMPLETED") return;
        (s.participants || []).forEach((p: any) => {
          const key = p.userId || p.id;
          const name = p.user ? `${p.user.firstName || ''} ${p.user.lastName || ''}`.trim() : 'Unknown';
          if (!userMap.has(key)) userMap.set(key, { name, correct: 0, total: 0, sessions: 0 });
          const u = userMap.get(key)!;
          u.sessions++;
          (p.answers || []).forEach((a: any) => { u.total++; if (a.isCorrect) u.correct++; });
        });
      });
      setUsers(Array.from(userMap.entries()).map(([id, d]) => ({
        id, name: d.name, avgAcc: d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0, sessions: d.sessions,
      })).sort((a, b) => b.avgAcc - a.avgAcc));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl sm:text-2xl font-bold text-white">Team Performance</h1><p className="text-gray-500 text-xs sm:text-sm mt-1">Individual accuracy and industry benchmarks</p></div>

      {/* Benchmark comparison */}
      {bench && bench.org.exercises > 0 && (
        <div className="cyber-card border-cyber-600/30 mb-6">
          <h2 className="font-display text-base font-semibold text-white mb-4">How You Compare</h2>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-3 bg-surface-0 rounded-lg">
              <p className="font-display text-2xl font-bold text-cyber-400">{bench.org.accuracy}%</p>
              <p className="text-gray-500 text-xs mt-1">Your Team</p>
            </div>
            <div className="text-center p-3 bg-surface-0 rounded-lg">
              <p className="font-display text-2xl font-bold text-gray-400">{bench.industry.averageAccuracy}%</p>
              <p className="text-gray-500 text-xs mt-1">{bench.industry.name} Avg</p>
            </div>
            <div className="text-center p-3 bg-surface-0 rounded-lg">
              <p className="font-display text-2xl font-bold text-yellow-400">{bench.platform.accuracy}%</p>
              <p className="text-gray-500 text-xs mt-1">All ThreatCast</p>
            </div>
          </div>
          {bench.percentile && (
            <div className="text-center">
              <p className="text-gray-400 text-sm">Your team is in the <span className={`font-bold ${bench.percentile >= 70 ? "text-green-400" : bench.percentile >= 40 ? "text-yellow-400" : "text-red-400"}`}>{bench.percentile}th percentile</span> for {bench.industry.name}</p>
            </div>
          )}
        </div>
      )}

      {/* Individual performance */}
      {loading ? <p className="text-gray-500 text-center py-12">Loading...</p> :
       users.length === 0 ? <div className="cyber-card text-center py-12"><p className="text-gray-400">No completed exercises yet</p></div> :
       <div className="space-y-3">{users.map(u => (
        <div key={u.id} className="cyber-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-white text-sm font-medium">{u.name}</p>
            <span className="text-cyber-400 font-mono text-sm">{u.avgAcc}%</span>
          </div>
          <div className="h-1.5 bg-surface-3 rounded-full mb-2">
            <div className={`h-full rounded-full ${u.avgAcc >= 70 ? "bg-green-500" : u.avgAcc >= 40 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${u.avgAcc}%` }} />
          </div>
          <p className="text-gray-500 text-xs">{u.sessions} exercise{u.sessions !== 1 ? "s" : ""}</p>
        </div>
       ))}</div>}
    </div>
  );
}
