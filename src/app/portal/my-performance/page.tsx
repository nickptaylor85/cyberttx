"use client";
import { useState, useEffect } from "react";

export default function MyPerformancePage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portal/sessions").then(r => r.json()).then(d => { setSessions(d || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const completed = sessions.filter(s => s.status === "COMPLETED");
  const myData = completed.map(s => {
    const p = s.participants?.[0];
    const answers = p?.answers || [];
    const correct = answers.filter((a: any) => a.isCorrect).length;
    return { title: s.title, theme: s.theme, date: s.completedAt || s.createdAt, score: p?.totalScore || 0, accuracy: answers.length > 0 ? Math.round((correct / answers.length) * 100) : 0, total: answers.length };
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const avgAcc = myData.length > 0 ? Math.round(myData.reduce((a, d) => a + d.accuracy, 0) / myData.length) : 0;
  const bestAcc = myData.length > 0 ? Math.max(...myData.map(d => d.accuracy)) : 0;
  const trend = myData.length >= 2 ? myData[0].accuracy - myData[myData.length - 1].accuracy : 0;

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl sm:text-2xl font-bold text-white">My Performance</h1><p className="text-gray-500 text-xs sm:text-sm mt-1">Your personal progress and accuracy trends</p></div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-cyber-400">{completed.length}</p><p className="text-gray-500 text-xs">Exercises</p></div>
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-green-400">{avgAcc}%</p><p className="text-gray-500 text-xs">Avg Accuracy</p></div>
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-yellow-400">{bestAcc}%</p><p className="text-gray-500 text-xs">Best Score</p></div>
        <div className="cyber-card text-center"><p className={`font-display text-2xl font-bold ${trend >= 0 ? "text-green-400" : "text-red-400"}`}>{trend >= 0 ? "+" : ""}{trend}%</p><p className="text-gray-500 text-xs">Trend</p></div>
      </div>

      {loading ? <p className="text-gray-500 text-center py-12">Loading...</p> : myData.length === 0 ? (
        <div className="cyber-card text-center py-12"><p className="text-gray-400">Complete your first exercise to see your performance</p></div>
      ) : (
        <div className="space-y-2">{myData.map((d, i) => (
          <div key={i} className="cyber-card">
            <div className="flex items-center justify-between mb-2">
              <div className="min-w-0 mr-3"><p className="text-white text-sm font-medium truncate">{d.title}</p><p className="text-gray-500 text-xs">{d.theme} · {new Date(d.date).toLocaleDateString("en-GB")}</p></div>
              <span className={`font-mono text-sm font-bold ${d.accuracy >= 70 ? "text-green-400" : d.accuracy >= 40 ? "text-yellow-400" : "text-red-400"}`}>{d.accuracy}%</span>
            </div>
            <div className="h-1.5 bg-surface-3 rounded-full"><div className={`h-full rounded-full ${d.accuracy >= 70 ? "bg-green-500" : d.accuracy >= 40 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${d.accuracy}%` }} /></div>
          </div>
        ))}</div>
      )}
    </div>
  );
}
