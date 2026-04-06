"use client";
import { useState, useEffect } from "react";

interface Announcement { id: string; title: string; message: string; type: string; active: boolean; createdAt: string; }

export default function AnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [title, setTitle] = useState(""); const [message, setMessage] = useState(""); const [type, setType] = useState("info");
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    // Load from localStorage (no DB table for this yet)
    const stored = localStorage.getItem("tc_announcements");
    if (stored) setItems(JSON.parse(stored));
  }, []);

  function save(newItems: Announcement[]) { setItems(newItems); localStorage.setItem("tc_announcements", JSON.stringify(newItems)); }

  function create() {
    if (!title || !message) return;
    const item: Announcement = { id: Date.now().toString(), title, message, type, active: true, createdAt: new Date().toISOString() };
    save([item, ...items]); setTitle(""); setMessage(""); setShowCreate(false);
  }
  function toggle(id: string) { save(items.map(i => i.id === id ? { ...i, active: !i.active } : i)); }
  function remove(id: string) { if (confirm("Delete this announcement?")) save(items.filter(i => i.id !== id)); }

  const tc: Record<string, string> = { info: "bg-blue-500/20 text-blue-400", warning: "bg-yellow-500/20 text-yellow-400", maintenance: "bg-purple-500/20 text-purple-400" };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="font-display text-xl sm:text-2xl font-bold text-white">Announcements</h1><p className="text-gray-500 text-xs mt-1">Banners shown to all portal users</p></div>
        <button onClick={() => setShowCreate(!showCreate)} className={showCreate ? "cyber-btn-secondary text-sm" : "cyber-btn-primary text-sm"}>{showCreate ? "Cancel" : "+ New"}</button>
      </div>
      {showCreate && (
        <div className="cyber-card mb-4 border-cyber-600/30">
          <div className="space-y-3">
            <div><label className="cyber-label">Title</label><input className="cyber-input w-full" value={title} onChange={e => setTitle(e.target.value)} placeholder="Scheduled Maintenance" /></div>
            <div><label className="cyber-label">Message</label><textarea className="cyber-input w-full h-20 resize-none" value={message} onChange={e => setMessage(e.target.value)} placeholder="We'll be performing maintenance on..." /></div>
            <div><label className="cyber-label">Type</label><div className="flex gap-2">{["info", "warning", "maintenance"].map(t => (
              <button key={t} onClick={() => setType(t)} className={`text-xs px-3 py-1.5 rounded border ${type === t ? "bg-cyber-600/15 border-cyber-500 text-cyber-400" : "bg-surface-0 border-surface-3 text-gray-400"}`}>{t}</button>
            ))}</div></div>
            <button onClick={create} disabled={!title || !message} className="cyber-btn-primary text-sm disabled:opacity-50">Publish</button>
          </div>
        </div>
      )}
      {items.length === 0 ? <div className="cyber-card text-center py-8"><p className="text-gray-500 text-sm">No announcements</p></div> :
        <div className="space-y-2">{items.map(i => (
          <div key={i.id} className={`cyber-card ${!i.active ? "opacity-50" : ""}`}>
            <div className="flex items-center justify-between">
              <div><div className="flex items-center gap-2 mb-1"><span className={`cyber-badge text-xs ${tc[i.type]}`}>{i.type}</span><span className={`text-xs ${i.active ? "text-green-400" : "text-gray-500"}`}>{i.active ? "Live" : "Hidden"}</span></div>
                <p className="text-white text-sm font-medium">{i.title}</p><p className="text-gray-500 text-xs mt-1">{i.message}</p></div>
              <div className="flex gap-1.5 flex-shrink-0"><button onClick={() => toggle(i.id)} className="cyber-btn-secondary text-xs py-1 px-2">{i.active ? "Hide" : "Show"}</button><button onClick={() => remove(i.id)} className="cyber-btn-danger text-xs py-1 px-2">Delete</button></div>
            </div>
          </div>
        ))}</div>
      }
    </div>
  );
}
