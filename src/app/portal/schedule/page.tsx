"use client";
import { useState, useEffect } from "react";
export default function SchedulePage() {
  const [items, setItems] = useState<any[]>([]); const [loading, setLoading] = useState(true); const [show, setShow] = useState(false);
  const [form, setForm] = useState({ title: "", theme: "ransomware", difficulty: "INTERMEDIATE", scheduledFor: "" });
  useEffect(() => { fetch("/api/portal/schedule").then(r => r.ok ? r.json() : []).then(setItems).finally(() => setLoading(false)); }, []);
  async function create(e: React.FormEvent) { e.preventDefault(); const r = await fetch("/api/portal/schedule", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) }); if (r.ok) { const s = await r.json(); setItems([...items, s]); setShow(false); } }
  return (
    <div>
      <div className="flex items-center justify-between mb-6"><div><h1 className="font-display text-xl sm:text-2xl font-bold text-white">Schedule</h1><p className="text-gray-500 text-xs sm:text-sm mt-1">Plan future exercises</p></div><button onClick={() => setShow(true)} className="cyber-btn-primary text-sm">+ Schedule</button></div>
      {show && <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"><div className="bg-surface-1 border border-surface-3 rounded-2xl p-6 w-full max-w-lg"><form onSubmit={create} className="space-y-4"><input className="cyber-input w-full" placeholder="Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required /><select className="cyber-input w-full" value={form.theme} onChange={e => setForm({...form, theme: e.target.value})}>{["ransomware","apt","insider-threat","supply-chain","bec","cloud-breach"].map(t => <option key={t} value={t}>{t}</option>)}</select><input type="datetime-local" className="cyber-input w-full" value={form.scheduledFor} onChange={e => setForm({...form, scheduledFor: e.target.value})} required /><div className="flex gap-3"><button type="button" onClick={() => setShow(false)} className="cyber-btn-secondary flex-1">Cancel</button><button type="submit" className="cyber-btn-primary flex-1">Schedule</button></div></form></div></div>}
      {loading ? <p className="text-gray-500 text-center py-12">Loading...</p> : items.length === 0 ? <div className="cyber-card text-center py-12"><p className="text-gray-400">No scheduled exercises</p></div> :
      <div className="space-y-2">{items.map((s: any) => <div key={s.id} className="cyber-card flex items-center justify-between"><div><p className="text-white text-sm">{s.title}</p><p className="text-gray-500 text-xs">{new Date(s.scheduledFor).toLocaleString()} · {s.theme}</p></div></div>)}</div>}
    </div>
  );
}
