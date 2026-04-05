"use client";
import { useState } from "react";
export default function ExerciseFeedback({ sessionId }: { sessionId: string }) {
  const [d, setD] = useState(0); const [r, setR] = useState(0); const [v, setV] = useState(0);
  const [comments, setComments] = useState(""); const [done, setDone] = useState(false); const [saving, setSaving] = useState(false);
  async function submit() { setSaving(true); await fetch("/api/portal/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId, difficultyRating: d, realismRating: r, relevanceRating: v, comments }) }); setDone(true); setSaving(false); }
  if (done) return <div className="cyber-card border-green-500/30 bg-green-500/5 text-center py-6"><p className="text-green-400 font-medium text-sm">Thanks for your feedback!</p></div>;
  const Star = ({ label, value, set }: { label: string; value: number; set: (v: number) => void }) => (
    <div className="flex items-center justify-between gap-3"><span className="text-gray-300 text-sm min-w-[90px]">{label}</span><div className="flex gap-1">{[1,2,3,4,5].map(n => <button key={n} onClick={() => set(n)} className={`w-8 h-8 rounded-lg text-sm ${n <= value ? "bg-cyber-600/30 text-cyber-400" : "bg-surface-2 text-gray-600"}`}>{n <= value ? "★" : "☆"}</button>)}</div></div>
  );
  return (<div className="cyber-card"><h3 className="font-display text-base font-semibold text-white mb-4">Rate This Exercise</h3><div className="space-y-3 mb-4"><Star label="Difficulty" value={d} set={setD} /><Star label="Realism" value={r} set={setR} /><Star label="Relevance" value={v} set={setV} /></div><textarea className="cyber-input w-full h-20 resize-none mb-3" placeholder="Comments?" value={comments} onChange={e => setComments(e.target.value)} /><button onClick={submit} disabled={saving || (!d && !r && !v)} className="cyber-btn-primary w-full py-2.5 text-sm disabled:opacity-50">{saving ? "Submitting..." : "Submit Feedback"}</button></div>);
}
