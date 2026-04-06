"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Challenge { id: string; week_start: string; theme: string; title: string; difficulty: string; }
interface LeaderboardEntry { rank: number; name: string; org: string; accuracy: number; isYou: boolean; }

export default function WeeklyChallengePage() {
  const router = useRouter();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myAttempt, setMyAttempt] = useState<{ accuracy: number } | null>(null);
  const [daysLeft, setDaysLeft] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetch("/api/portal/weekly-challenge")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d) {
          setChallenge(d.challenge);
          setLeaderboard(d.leaderboard);
          setMyAttempt(d.myAttempt);
          setDaysLeft(d.daysLeft);
          setTotalAttempts(d.totalAttempts);
        }
        setLoading(false);
      }).catch(() => setLoading(false));
  }, []);

  async function startChallenge() {
    if (!challenge) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/ttx/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          theme: challenge.theme, difficulty: challenge.difficulty,
          mode: "INDIVIDUAL", questionCount: 10,
          customIncident: `WEEKLY CHALLENGE: ${challenge.title}. This is the platform-wide weekly challenge for the week of ${challenge.week_start}. Make it engaging and challenging.`,
        }),
      });
      const data = await res.json();
      if (res.ok && data.id) {
        // Record the attempt
        await fetch("/api/portal/weekly-challenge/attempt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ challengeId: challenge.id, sessionId: data.id, accuracy: 0 }),
        });
        window.location.href = `/portal/ttx/${data.id}`;
      } else {
        alert(data.error || "Failed to generate");
        setGenerating(false);
      }
    } catch { setGenerating(false); }
  }

  const medals = ["🥇", "🥈", "🥉"];
  const tc: Record<string, string> = {
    ransomware: "🔒", phishing: "🎣", apt: "🕵️", "insider-threat": "👤",
    "supply-chain": "📦", "cloud-breach": "☁️", "data-exfil": "💾", ddos: "🌊",
  };

  if (loading) return <div className="text-center py-20"><p className="text-gray-500 text-sm">Loading challenge...</p></div>;

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl sm:text-2xl font-bold text-white">Weekly Challenge</h1><p className="text-gray-500 text-xs mt-1">New challenge every Monday · Compete across the platform</p></div>

      {challenge && (
        <>
          {/* Challenge Card */}
          <div className="cyber-card border-cyber-600/30 bg-gradient-to-br from-cyber-600/5 to-transparent mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-3xl">{tc[challenge.theme] || "🎯"}</span>
                <span className="cyber-badge text-xs bg-cyber-600/20 text-cyber-400 animate-pulse">This Week</span>
              </div>
              <div className="text-right">
                <p className="text-cyber-400 text-xs font-mono">{daysLeft} days left</p>
                <p className="text-gray-600 text-xs">{totalAttempts} attempts</p>
              </div>
            </div>
            <h2 className="font-display text-lg font-bold text-white">{challenge.title}</h2>
            <div className="flex gap-2 mt-2 mb-4">
              <span className="cyber-badge text-xs bg-surface-3 text-gray-400 capitalize">{challenge.theme.replace(/-/g, " ")}</span>
              <span className="cyber-badge text-xs bg-surface-3 text-gray-400">{challenge.difficulty}</span>
              <span className="cyber-badge text-xs bg-surface-3 text-gray-400">10 questions</span>
            </div>

            {myAttempt ? (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-green-400 text-sm font-semibold">Challenge Completed! Your score: {myAttempt.accuracy}%</p>
                <p className="text-gray-500 text-xs mt-1">Your best score is saved. Try again to improve your ranking.</p>
                <button onClick={startChallenge} disabled={generating} className="cyber-btn-secondary text-xs mt-2 disabled:opacity-50">{generating ? "Generating..." : "Try Again"}</button>
              </div>
            ) : (
              <button onClick={startChallenge} disabled={generating} className="cyber-btn-primary w-full py-3 text-base disabled:opacity-50">
                {generating ? "Generating Challenge..." : "🚀 Start Challenge"}
              </button>
            )}
          </div>

          {/* Leaderboard */}
          <div className="cyber-card">
            <h2 className="text-white text-sm font-semibold mb-4">Challenge Leaderboard</h2>
            {leaderboard.length === 0 ? (
              <p className="text-gray-500 text-xs text-center py-4">No attempts yet — be the first!</p>
            ) : (
              <div className="space-y-2">{leaderboard.map((entry, i) => (
                <div key={i} className={`flex items-center gap-3 p-2 rounded-lg ${entry.isYou ? "bg-cyber-600/10 border border-cyber-600/20" : i < 3 ? "bg-surface-0 border border-surface-3" : ""}`}>
                  <span className="text-lg w-8 text-center flex-shrink-0">{i < 3 ? medals[i] : <span className="text-gray-600 text-sm font-mono">#{entry.rank}</span>}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{entry.name}{entry.isYou ? " (you)" : ""}</p>
                    {entry.org && <p className="text-gray-600 text-xs">{entry.org}</p>}
                  </div>
                  <p className={`font-mono text-base font-bold flex-shrink-0 ${entry.accuracy >= 70 ? "text-green-400" : entry.accuracy >= 40 ? "text-yellow-400" : "text-red-400"}`}>{entry.accuracy}%</p>
                </div>
              ))}</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
