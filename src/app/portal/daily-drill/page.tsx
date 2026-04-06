"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface Question { question: string; options: { text: string; isCorrect: boolean }[]; explanation: string; }

export default function DailyDrillPage() {
  const [topic, setTopic] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(120);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetch("/api/portal/daily-drill").then(r => r.ok ? r.json() : null).then(d => {
      if (d) { setTopic(d.topic); setQuestions(d.questions || []); }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading && questions.length > 0 && !done) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => { if (prev <= 1) { setDone(true); return 0; } return prev - 1; });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [loading, questions, done]);

  function answer(idx: number) {
    if (answered) return;
    setSelected(idx); setAnswered(true);
    if (questions[current].options[idx].isCorrect) setScore(s => s + 1);
  }

  function next() {
    if (current < questions.length - 1) { setCurrent(c => c + 1); setSelected(null); setAnswered(false); }
    else { setDone(true); if (timerRef.current) clearInterval(timerRef.current); }
  }

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  if (loading) return <div className="text-center py-20"><p className="text-gray-500 text-sm">Loading today&apos;s drill...</p></div>;

  if (done) {
    const pct = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <p className="text-4xl mb-3">{pct >= 67 ? "🎯" : pct >= 34 ? "💪" : "📚"}</p>
        <h2 className="font-display text-2xl font-bold text-white">{score}/{questions.length}</h2>
        <p className="text-gray-500 text-sm mt-1">Today&apos;s drill: {topic}</p>
        <p className={`text-lg font-bold mt-2 ${pct >= 67 ? "text-green-400" : pct >= 34 ? "text-yellow-400" : "text-red-400"}`}>{pct}%</p>
        <p className="text-gray-600 text-xs mt-1">Time remaining: {mins}:{secs.toString().padStart(2, "0")}</p>
        <div className="flex gap-2 justify-center mt-6">
          <Link href="/portal/challenge" className="cyber-btn-secondary text-sm">Weekly Challenge</Link>
          <Link href="/portal/ttx" className="cyber-btn-primary text-sm">Full Exercise</Link>
        </div>
        <p className="text-gray-600 text-xs mt-4">New drill tomorrow. Come back to keep your streak!</p>
      </div>
    );
  }

  const q = questions[current];
  if (!q) return null;

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div><h1 className="font-display text-lg font-bold text-white">Daily Drill</h1><p className="text-gray-500 text-xs">{topic}</p></div>
        <div className="text-right">
          <p className={`font-mono text-lg font-bold ${timeLeft < 30 ? "text-red-400" : "text-cyber-400"}`}>{mins}:{secs.toString().padStart(2, "0")}</p>
          <p className="text-gray-600 text-xs">Q{current + 1}/{questions.length}</p>
        </div>
      </div>
      <div className="h-1 bg-surface-3 rounded-full mb-6"><div className="h-full bg-cyber-500 rounded-full transition-all" style={{ width: `${((current + (answered ? 1 : 0)) / questions.length) * 100}%` }} /></div>
      <div className="cyber-card mb-4"><p className="text-white text-sm">{q.question}</p></div>
      <div className="space-y-2">{q.options.map((o, i) => (
        <button key={i} onClick={() => answer(i)} disabled={answered}
          className={`w-full text-left p-3 rounded-lg border text-sm transition-all ${answered ? (o.isCorrect ? "border-green-500 bg-green-500/10 text-green-400" : i === selected ? "border-red-500 bg-red-500/10 text-red-400" : "border-surface-3 text-gray-500") : selected === i ? "border-cyber-500 bg-cyber-500/10 text-white" : "border-surface-3 text-gray-300 hover:border-surface-4"}`}>
          {o.text}
        </button>
      ))}</div>
      {answered && (
        <div className="mt-3">
          <p className="text-gray-400 text-xs mb-3">{q.explanation}</p>
          <button onClick={next} className="cyber-btn-primary w-full">{current < questions.length - 1 ? "Next →" : "Finish"}</button>
        </div>
      )}
    </div>
  );
}
