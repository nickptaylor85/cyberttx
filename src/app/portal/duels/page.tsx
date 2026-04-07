"use client";
import { useState, useEffect, useRef } from "react";

interface Question { question: string; options: { text: string; isCorrect: boolean }[]; explanation: string; }
interface Duel { id: string; challenger_id: string; opponent_id: string; challenger_name: string; opponent_name: string; theme: string; status: string; questions: Question[]; challenger_answers: any; opponent_answers: any; challenger_score: number; opponent_score: number; winner_id: string; created_at: string; }

export default function DuelsPage() {
  const [duels, setDuels] = useState<Duel[]>([]);
  const [userId, setUserId] = useState("");
  const [creating, setCreating] = useState(false);
  const [theme, setTheme] = useState("ransomware");
  const [activeDuel, setActiveDuel] = useState<Duel | null>(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<{ correct: boolean }[]>([]);
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(75);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  function loadDuels() {
    fetch("/api/portal/duels").then(r => r.ok ? r.json() : null).then(d => {
      if (d) { setDuels(d.duels || []); setUserId(d.userId); }
      setLoading(false);
    }).catch(() => setLoading(false));
  }

  useEffect(() => { loadDuels(); }, []);

  async function createDuel() {
    setCreating(true);
    const res = await fetch("/api/portal/duels", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", theme }),
    });
    const data = await res.json();
    setCreating(false);
    if (data.duelId) { loadDuels(); }
    else { alert(data.error || "Failed to create duel"); }
  }

  async function joinDuel(duelId: string) {
    const res = await fetch("/api/portal/duels", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "join", duelId }),
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Could not join duel");
    }
  }

  function startPlaying(duel: Duel) {
    const q = typeof duel.questions === "string" ? JSON.parse(duel.questions as any) : duel.questions;
    setActiveDuel({ ...duel, questions: q });
    setCurrent(0); setAnswers([]); setAnswered(false); setSelected(null); setTimeLeft(75);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => { if (prev <= 1) { return 0; } return prev - 1; });
    }, 1000);
  }

  function answer(idx: number) {
    if (answered || !activeDuel) return;
    setSelected(idx); setAnswered(true);
    const isCorrect = activeDuel.questions[current].options[idx].isCorrect;
    setAnswers(prev => [...prev, { correct: isCorrect }]);
  }

  async function next() {
    if (!activeDuel) return;
    if (current < activeDuel.questions.length - 1) {
      setCurrent(c => c + 1); setAnswered(false); setSelected(null);
    } else {
      // Submit answers
      if (timerRef.current) clearInterval(timerRef.current);
      setSubmitting(true);
      const finalAnswers = [...answers];
      await fetch("/api/portal/duels", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "answer", duelId: activeDuel.id, answers: finalAnswers }),
      });
      setActiveDuel(null); setSubmitting(false);
      loadDuels();
    }
  }

  const themes = ["ransomware", "phishing", "apt", "insider-threat", "supply-chain", "cloud-breach"];
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  if (loading) return <div className="text-center py-20"><p className="text-gray-500 text-sm">Loading duels...</p></div>;

  // Playing a duel
  if (activeDuel && activeDuel.questions.length > 0) {
    const q = activeDuel.questions[current];
    return (
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div><h1 className="font-display text-lg font-bold text-white">⚔️ Duel</h1><p className="text-gray-500 text-xs">{activeDuel.theme}</p></div>
          <div className="text-right">
            <p className={`font-mono text-lg font-bold ${timeLeft < 15 ? "text-red-400" : "text-cyber-400"}`}>{mins}:{secs.toString().padStart(2, "0")}</p>
            <p className="text-gray-600 text-xs">Q{current + 1}/{activeDuel.questions.length}</p>
          </div>
        </div>
        <div className="h-1 bg-surface-3 rounded-full mb-4"><div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${((current + (answered ? 1 : 0)) / activeDuel.questions.length) * 100}%` }} /></div>
        <div className="cyber-card mb-4"><p className="text-white text-sm">{q.question}</p></div>
        <div className="space-y-2">{q.options.map((o, i) => (
          <button key={i} onClick={() => answer(i)} disabled={answered}
            className={`w-full text-left p-3 rounded-lg border text-sm transition-all ${answered ? (o.isCorrect ? "border-green-500 bg-green-500/10 text-green-400" : i === selected ? "border-red-500 bg-red-500/10 text-red-400" : "border-surface-3 text-gray-500") : "border-surface-3 text-gray-300 hover:border-surface-4"}`}>
            {o.text}
          </button>
        ))}</div>
        {answered && (
          <div className="mt-3">
            <p className="text-gray-400 text-xs mb-3">{q.explanation}</p>
            <button onClick={next} className="cyber-btn-primary w-full" disabled={submitting}>
              {submitting ? "Submitting..." : current < activeDuel.questions.length - 1 ? "Next →" : "Submit Duel"}
            </button>
          </div>
        )}
      </div>
    );
  }

  // Lobby
  const pendingForMe = duels.filter(d => d.status === "OPEN" && d.challenger_id !== userId);
  const myActive = duels.filter(d => d.status === "ACTIVE" && (d.challenger_id === userId || d.opponent_id === userId));
  const needsMyAnswer = myActive.filter(d => {
    const isChallenger = d.challenger_id === userId;
    const myAnswers = isChallenger ? d.challenger_score : d.opponent_score;
    // Check if we've actually submitted (score could be 0 for unanswered too)
    const rawAnswers = isChallenger 
      ? (typeof d.challenger_answers === "string" ? JSON.parse(d.challenger_answers) : d.challenger_answers || [])
      : (typeof d.opponent_answers === "string" ? JSON.parse(d.opponent_answers) : d.opponent_answers || []);
    return rawAnswers.length === 0;
  });
  const completed = duels.filter(d => d.status === "COMPLETED");
  const myPending = duels.filter(d => d.status === "OPEN" && d.challenger_id === userId);

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl sm:text-2xl font-bold text-white">⚔️ Head-to-Head Duels</h1><p className="text-gray-500 text-xs mt-1">Challenge a teammate to a 5-question rapid-fire battle</p></div>

      {/* Create a duel */}
      <div className="cyber-card mb-4 border-purple-500/20 bg-gradient-to-br from-purple-600/5 to-transparent">
        <h2 className="text-white text-sm font-semibold mb-3">Create a Duel</h2>
        <div className="flex flex-wrap gap-2 mb-3">{themes.map(t => (
          <button key={t} onClick={() => setTheme(t)} className={`px-3 py-1.5 rounded-lg border text-xs transition-colors capitalize ${theme === t ? "border-purple-500 bg-purple-500/10 text-purple-400" : "border-surface-3 text-gray-500 hover:border-surface-4"}`}>{t.replace(/-/g, " ")}</button>
        ))}</div>
        <button onClick={createDuel} disabled={creating} className="cyber-btn-primary disabled:opacity-50">{creating ? "Generating questions..." : "⚔️ Create Duel"}</button>
        <p className="text-gray-600 text-xs mt-2">Creates an open duel anyone on your team can join.</p>
      </div>

      {/* Duels needing my answer */}
      {needsMyAnswer.length > 0 && (
        <div className="cyber-card mb-4 border-orange-500/20">
          <h2 className="text-orange-400 text-sm font-semibold mb-3">🔥 Your Turn ({needsMyAnswer.length})</h2>
          <div className="space-y-2">{needsMyAnswer.map(d => (
            <div key={d.id} className="flex items-center justify-between py-2 border-b border-surface-3/30 last:border-0">
              <div><p className="text-white text-sm">vs {d.challenger_id === userId ? d.opponent_name : d.challenger_name}</p><p className="text-gray-500 text-xs capitalize">{d.theme?.replace(/-/g, " ")}</p></div>
              <button onClick={() => startPlaying(d)} className="cyber-btn-primary text-xs py-1.5 px-3">Play →</button>
            </div>
          ))}</div>
        </div>
      )}

      {/* Open duels to join */}
      {pendingForMe.length > 0 && (
        <div className="cyber-card mb-4">
          <h2 className="text-white text-sm font-semibold mb-3">Open Challenges ({pendingForMe.length})</h2>
          <div className="space-y-2">{pendingForMe.map(d => (
            <div key={d.id} className="flex items-center justify-between py-2 border-b border-surface-3/30 last:border-0">
              <div><p className="text-white text-sm">{d.challenger_name} challenges you!</p><p className="text-gray-500 text-xs capitalize">{d.theme?.replace(/-/g, " ")} · 5 questions</p></div>
              <button onClick={async () => { await joinDuel(d.id); loadDuels(); }} className="cyber-btn-primary text-xs py-1.5 px-3">Accept Challenge</button>
            </div>
          ))}</div>
        </div>
      )}

      {/* My open duels waiting for opponent */}
      {myPending.length > 0 && (
        <div className="cyber-card mb-4">
          <h2 className="text-white text-sm font-semibold mb-3">Waiting for Opponent ({myPending.length})</h2>
          <div className="space-y-2">{myPending.map(d => (
            <div key={d.id} className="flex items-center justify-between py-2 border-b border-surface-3/30 last:border-0">
              <p className="text-gray-400 text-xs capitalize">{d.theme?.replace(/-/g, " ")} · Created {new Date(d.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</p>
              <span className="cyber-badge text-xs bg-yellow-500/20 text-yellow-400">Waiting...</span>
            </div>
          ))}</div>
        </div>
      )}

      {/* Completed duels */}
      {completed.length > 0 && (
        <div className="cyber-card">
          <h2 className="text-white text-sm font-semibold mb-3">Recent Results ({completed.length})</h2>
          <div className="space-y-2">{completed.map(d => {
            const isChallenger = d.challenger_id === userId;
            const myScore = isChallenger ? d.challenger_score : d.opponent_score;
            const theirScore = isChallenger ? d.opponent_score : d.challenger_score;
            const opponentName = isChallenger ? d.opponent_name : d.challenger_name;
            const won = d.winner_id === userId;
            const draw = !d.winner_id;
            return (
              <div key={d.id} className={`flex items-center justify-between py-2 border-b border-surface-3/30 last:border-0 ${won ? "bg-green-500/5 -mx-2 px-2 rounded" : ""}`}>
                <div className="flex items-center gap-3">
                  <span className="text-lg">{won ? "🏆" : draw ? "🤝" : "😤"}</span>
                  <div><p className="text-white text-sm">vs {opponentName || "Opponent"}</p><p className="text-gray-500 text-xs capitalize">{d.theme?.replace(/-/g, " ")}</p></div>
                </div>
                <div className="text-right">
                  <p className={`font-mono text-sm font-bold ${won ? "text-green-400" : draw ? "text-yellow-400" : "text-red-400"}`}>{myScore} — {theirScore}</p>
                  <p className="text-gray-600 text-xs">{won ? "Victory!" : draw ? "Draw" : "Defeat"}</p>
                </div>
              </div>
            );
          })}</div>
        </div>
      )}

      {duels.length === 0 && (
        <div className="cyber-card text-center py-8">
          <p className="text-3xl mb-2">⚔️</p>
          <p className="text-gray-500 text-sm">No duels yet. Create one to challenge your team!</p>
        </div>
      )}
    </div>
  );
}
