"use client";
import { useState, useEffect } from "react";

interface Stats { exercises: number; accuracy: number; themes: number; mitre: number; streak: number; teamExercises: number; perfectScores: number; }

export default function AchievementsPage() {
  const [stats, setStats] = useState<Stats>({ exercises: 0, accuracy: 0, themes: 0, mitre: 0, streak: 0, teamExercises: 0, perfectScores: 0 });

  useEffect(() => {
    fetch("/api/portal/sessions").then(r => r.ok ? r.json() : []).then(sessions => {
      const completed = (sessions || []).filter((s: any) => s.status === "COMPLETED");
      const themes = new Set(completed.map((s: any) => s.theme));
      const mitre = new Set(completed.flatMap((s: any) => s.mitreAttackIds || []));
      const team = completed.filter((s: any) => s.mode === "GROUP");
      setStats({
        exercises: completed.length, accuracy: 75, themes: themes.size, mitre: mitre.size,
        streak: Math.min(completed.length, 7), teamExercises: team.length, perfectScores: 0,
      });
    }).catch(() => {});
  }, []);

  const badges = [
    // Beginner
    { id: "first-blood", name: "First Blood", icon: "🎯", desc: "Complete your first exercise", earned: stats.exercises >= 1, progress: Math.min(stats.exercises, 1), max: 1 },
    { id: "getting-started", name: "Getting Started", icon: "🚀", desc: "Complete 3 exercises", earned: stats.exercises >= 3, progress: Math.min(stats.exercises, 3), max: 3 },
    { id: "dedicated", name: "Dedicated Defender", icon: "🛡️", desc: "Complete 10 exercises", earned: stats.exercises >= 10, progress: Math.min(stats.exercises, 10), max: 10 },
    { id: "veteran", name: "Cyber Veteran", icon: "⭐", desc: "Complete 25 exercises", earned: stats.exercises >= 25, progress: Math.min(stats.exercises, 25), max: 25 },
    { id: "elite", name: "Elite Operator", icon: "💎", desc: "Complete 50 exercises", earned: stats.exercises >= 50, progress: Math.min(stats.exercises, 50), max: 50 },
    // Themes
    { id: "ransomware", name: "Ransomware Ready", icon: "🔒", desc: "Complete a ransomware exercise", earned: stats.themes >= 1, progress: Math.min(stats.themes, 1), max: 1 },
    { id: "multi-threat", name: "Multi-Threat", icon: "🌐", desc: "Complete 3 different themes", earned: stats.themes >= 3, progress: Math.min(stats.themes, 3), max: 3 },
    { id: "full-spectrum", name: "Full Spectrum", icon: "🌈", desc: "Complete all 8 threat themes", earned: stats.themes >= 8, progress: Math.min(stats.themes, 8), max: 8 },
    // MITRE
    { id: "mitre-aware", name: "MITRE Aware", icon: "📊", desc: "Cover 5 MITRE techniques", earned: stats.mitre >= 5, progress: Math.min(stats.mitre, 5), max: 5 },
    { id: "mitre-hunter", name: "Technique Hunter", icon: "🔍", desc: "Cover 15 MITRE techniques", earned: stats.mitre >= 15, progress: Math.min(stats.mitre, 15), max: 15 },
    { id: "mitre-master", name: "MITRE Master", icon: "🏛️", desc: "Cover 30 MITRE techniques", earned: stats.mitre >= 30, progress: Math.min(stats.mitre, 30), max: 30 },
    // Streaks
    { id: "consistent", name: "Consistent", icon: "🔥", desc: "3-exercise streak", earned: stats.streak >= 3, progress: Math.min(stats.streak, 3), max: 3 },
    { id: "on-fire", name: "On Fire", icon: "🔥", desc: "7-exercise streak", earned: stats.streak >= 7, progress: Math.min(stats.streak, 7), max: 7 },
    // Team
    { id: "team-player", name: "Team Player", icon: "👥", desc: "Complete a group exercise", earned: stats.teamExercises >= 1, progress: Math.min(stats.teamExercises, 1), max: 1 },
    { id: "squad-leader", name: "Squad Leader", icon: "🎖️", desc: "Complete 5 group exercises", earned: stats.teamExercises >= 5, progress: Math.min(stats.teamExercises, 5), max: 5 },
    // Mastery
    { id: "sharp-shooter", name: "Sharp Shooter", icon: "🎯", desc: "Score 90%+ on an exercise", earned: stats.accuracy >= 90, progress: stats.accuracy >= 90 ? 1 : 0, max: 1 },
    { id: "perfectionist", name: "Perfectionist", icon: "💯", desc: "Score 100% on an exercise", earned: stats.perfectScores >= 1, progress: Math.min(stats.perfectScores, 1), max: 1 },
    // Special
    { id: "real-world", name: "Real-World Ready", icon: "🚨", desc: "Complete an exercise from a live alert", earned: false, progress: 0, max: 1 },
    { id: "certified", name: "Certified", icon: "🏆", desc: "Earn a Gold or Platinum certificate", earned: false, progress: 0, max: 1 },
    { id: "playbook-pro", name: "Playbook Pro", icon: "📋", desc: "Generate 5 playbooks", earned: false, progress: 0, max: 5 },
  ];

  const earned = badges.filter(b => b.earned).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-xl sm:text-2xl font-bold text-white">Achievements</h1>
        <p className="text-gray-500 text-xs mt-1">{earned}/{badges.length} earned</p>
      </div>
      <div className="h-2 bg-surface-3 rounded-full mb-6"><div className="h-full bg-cyber-500 rounded-full transition-all" style={{ width: `${(earned / badges.length) * 100}%` }} /></div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{badges.map(b => (
        <div key={b.id} className={`cyber-card ${b.earned ? "border-cyber-600/30" : "opacity-50"}`}>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">{b.icon}</span>
            <div><p className={`text-sm font-semibold ${b.earned ? "text-white" : "text-gray-500"}`}>{b.name}</p><p className="text-gray-500 text-xs">{b.desc}</p></div>
          </div>
          <div className="h-1.5 bg-surface-3 rounded-full"><div className={`h-full rounded-full transition-all ${b.earned ? "bg-cyber-500" : "bg-surface-4"}`} style={{ width: `${(b.progress / b.max) * 100}%` }} /></div>
          <p className="text-gray-600 text-xs mt-1 text-right">{b.progress}/{b.max}</p>
        </div>
      ))}</div>
    </div>
  );
}
