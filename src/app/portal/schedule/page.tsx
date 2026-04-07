"use client";
import { useState, useEffect } from "react";

interface ScheduledExercise { id: string; title: string; theme: string; difficulty: string; scheduled_for: string; recurring: string; }

export default function SchedulePage() {
  const [items, setItems] = useState<ScheduledExercise[]>([]);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", theme: "ransomware", difficulty: "INTERMEDIATE", scheduledFor: "", recurring: "none" });

  function load() {
    fetch("/api/portal/schedule").then(r => r.ok ? r.json() : []).then(d => { setItems(Array.isArray(d) ? d : []); setLoading(false); }).catch(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  async function create() {
    if (!form.title || !form.scheduledFor) return;
    await fetch("/api/portal/schedule", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ title: "", theme: "ransomware", difficulty: "INTERMEDIATE", scheduledFor: "", recurring: "none" }); setShow(false); load();
  }

  async function remove(id: string) {
    await fetch("/api/portal/schedule", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    load();
  }

  if (loading) return <p className="text-gray-500 text-center py-12">Loading...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="font-display text-xl sm:text-2xl font-bold text-white">Schedule</h1><p className="text-gray-500 text-xs mt-1">{items.length} scheduled exercises</p></div>
        <button onClick={() => setShow(!show)} className={show ? "cyber-btn-secondary text-sm" : "cyber-btn-primary text-sm"}>{show ? "Cancel" : "+ Schedule"}</button>
      </div>

      {show && (
        <div className="cyber-card mb-4 border-cyber-600/30">
          <div className="space-y-3">
            <div><label className="cyber-label">Exercise Name</label><input className="cyber-input w-full" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Monthly Ransomware Drill" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="cyber-label">Theme</label><select className="cyber-input w-full" value={form.theme} onChange={e => setForm(f => ({ ...f, theme: e.target.value }))}>{["ransomware", "phishing", "insider-threat", "supply-chain", "data-exfil", "apt", "cloud-breach", "ddos"].map(t => <option key={t} value={t}>{t}</option>)}</select></div>
              <div><label className="cyber-label">Difficulty</label><select className="cyber-input w-full" value={form.difficulty} onChange={e => setForm(f => ({ ...f, difficulty: e.target.value }))}>{["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"].map(d => <option key={d} value={d}>{d}</option>)}</select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="cyber-label">Date & Time</label><input type="datetime-local" className="cyber-input w-full" value={form.scheduledFor} onChange={e => setForm(f => ({ ...f, scheduledFor: e.target.value }))} /></div>
              <div><label className="cyber-label">Recurring</label><select className="cyber-input w-full" value={form.recurring} onChange={e => setForm(f => ({ ...f, recurring: e.target.value }))}><option value="none">One-time</option><option value="weekly">Weekly</option><option value="biweekly">Fortnightly</option><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option></select></div>
            </div>
            <button onClick={create} disabled={!form.title || !form.scheduledFor} className="cyber-btn-primary text-sm disabled:opacity-50">Schedule Exercise</button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="cyber-card text-center py-12"><p className="text-gray-400 text-sm">No scheduled exercises</p><p className="text-gray-500 text-xs mt-1">Schedule recurring exercises for compliance evidence</p></div>
      ) : (
        <div className="space-y-2">{items.map(item => (
          <div key={item.id} className="cyber-card flex items-center justify-between">
            <div><p className="text-white text-sm">{item.title}</p><p className="text-gray-500 text-xs">{item.theme} · {item.difficulty} · {new Date(item.scheduled_for).toLocaleString("en-GB")} · {item.recurring === "none" ? "One-time" : item.recurring}</p></div>
            <button onClick={() => remove(item.id)} className="text-red-400/60 hover:text-red-400 text-xs">Remove</button>
          </div>
        ))}</div>
      )}
    </div>
  );
}
