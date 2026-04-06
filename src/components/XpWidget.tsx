"use client";
import { useState, useEffect } from "react";

interface XpData {
  totalXp: number; level: { level: number; name: string; xp: number };
  nextLevel: { level: number; name: string; xp: number };
  xpToNext: number; progressPercent: number;
  streak: number; bestStreak: number; exercisesCompleted: number;
}

export default function XpWidget() {
  const [data, setData] = useState<XpData | null>(null);

  useEffect(() => {
    fetch("/api/portal/xp").then(r => r.ok ? r.json() : null).then(setData).catch(() => {});
  }, []);

  if (!data) return null;

  return (
    <div className="cyber-card mb-4 border-cyber-600/20">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚡</span>
          <div>
            <p className="text-white text-sm font-semibold">Level {data.level.level}: {data.level.name}</p>
            <p className="text-gray-500 text-xs">{data.totalXp.toLocaleString()} XP · {data.exercisesCompleted} exercises</p>
          </div>
        </div>
        <div className="text-right">
          {data.streak > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-orange-400">🔥</span>
              <span className="text-orange-400 text-sm font-bold">{data.streak}</span>
              <span className="text-gray-500 text-xs">day streak</span>
            </div>
          )}
        </div>
      </div>
      <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-cyber-600 to-green-500 rounded-full transition-all" style={{ width: `${data.progressPercent}%` }} />
      </div>
      <p className="text-gray-600 text-xs mt-1">{data.xpToNext > 0 ? `${data.xpToNext.toLocaleString()} XP to ${data.nextLevel.name}` : "Max level!"}</p>
    </div>
  );
}
