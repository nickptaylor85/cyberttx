"use client";
import { useState, useEffect } from "react";

interface Badge { id: string; name: string; icon: string; desc: string; earned: boolean; progress: number; max: number; }

export default function AchievementsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portal/sessions").then(r => r.json()).then(sessions => {
      const completed = (sessions || []).filter((s: any) => s.status === "COMPLETED");
      const themes = new Set(completed.map((s: any) => s.theme));
      const totalQ = completed.reduce((a: number, s: any) => a + (s.participants?.[0]?.answers?.length || 0), 0);
      const correctQ = completed.reduce((a: number, s: any) => a + (s.participants?.[0]?.answers?.filter((a2: any) => a2.isCorrect)?.length || 0), 0);
      setStats({ completed: completed.length, themes: themes.size, totalQ, correctQ });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const c = stats?.completed || 0;
  const th = stats?.themes || 0;
  const acc = stats?.totalQ > 0 ? Math.round((stats.correctQ / stats.totalQ) * 100) : 0;

  const badges: Badge[] = [
    { id: "first", name: "First Steps", icon: "🎯", desc: "Complete your first exercise", earned: c >= 1, progress: Math.min(c, 1), max: 1 },
    { id: "five", name: "Getting Serious", icon: "⭐", desc: "Complete 5 exercises", earned: c >= 5, progress: Math.min(c, 5), max: 5 },
    { id: "ten", name: "Veteran", icon: "🏅", desc: "Complete 10 exercises", earned: c >= 10, progress: Math.min(c, 10), max: 10 },
    { id: "twentyfive", name: "Elite Defender", icon: "🛡️", desc: "Complete 25 exercises", earned: c >= 25, progress: Math.min(c, 25), max: 25 },
    { id: "themes3", name: "Versatile", icon: "🎭", desc: "Try 3 different threat themes", earned: th >= 3, progress: Math.min(th, 3), max: 3 },
    { id: "themes7", name: "Threat Explorer", icon: "🗺️", desc: "Try 7 different threat themes", earned: th >= 7, progress: Math.min(th, 7), max: 7 },
    { id: "acc70", name: "Sharp Shooter", icon: "🎯", desc: "Achieve 70% overall accuracy", earned: acc >= 70, progress: Math.min(acc, 70), max: 70 },
    { id: "acc90", name: "Perfectionist", icon: "💎", desc: "Achieve 90% overall accuracy", earned: acc >= 90, progress: Math.min(acc, 90), max: 90 },
    { id: "streak3", name: "On Fire", icon: "🔥", desc: "Complete 3 exercises in one week", earned: false, progress: 0, max: 3 },
    { id: "mitre", name: "MITRE Champion", icon: "🏆", desc: "Test all 14 MITRE ATT&CK tactics", earned: false, progress: 0, max: 14 },
    { id: "playbook", name: "Playbook Author", icon: "📖", desc: "Generate your first IR playbook", earned: false, progress: 0, max: 1 },
    { id: "team", name: "Team Player", icon: "👥", desc: "Participate in a group exercise", earned: false, progress: 0, max: 1 },
  ];

  const earned = badges.filter(b => b.earned).length;

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl sm:text-2xl font-bold text-white">Achievements</h1><p className="text-gray-500 text-xs sm:text-sm mt-1">{earned}/{badges.length} badges earned</p></div>

      <div className="h-2 bg-surface-3 rounded-full mb-6"><div className="h-full bg-cyber-500 rounded-full" style={{ width: `${(earned / badges.length) * 100}%` }} /></div>

      {loading ? <p className="text-gray-500 text-center py-12">Loading...</p> :
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">{badges.map(b => (
          <div key={b.id} className={`cyber-card text-center transition-all ${b.earned ? "border-cyber-600/30 bg-cyber-600/5" : "opacity-50"}`}>
            <span className="text-3xl">{b.icon}</span>
            <p className={`text-sm font-semibold mt-2 ${b.earned ? "text-white" : "text-gray-500"}`}>{b.name}</p>
            <p className="text-gray-500 text-xs mt-1">{b.desc}</p>
            {!b.earned && <div className="mt-2"><div className="h-1 bg-surface-3 rounded-full"><div className="h-full bg-cyber-600/50 rounded-full" style={{ width: `${(b.progress / b.max) * 100}%` }} /></div><p className="text-gray-600 text-xs mt-1">{b.progress}/{b.max}</p></div>}
            {b.earned && <p className="text-cyber-400 text-xs mt-2 font-semibold">✓ Earned</p>}
          </div>
        ))}</div>
      }
    </div>
  );
}
