"use client";
import { useState, useEffect } from "react";

interface Announcement { id: string; title: string; message: string; type: string; active: boolean; created_at: string; }

export default function AnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [title, setTitle] = useState(""); const [message, setMessage] = useState(""); const [type, setType] = useState("info");
  const [showCreate, setShowCreate] = useState(false);

  function load() { fetch("/api/admin/announcements").then(r => r.ok ? r.json() : []).then(setItems); }
  useEffect(() => { load(); }, []);

  async function create() {
    if (!title || !message) return;
    await fetch("/api/admin/announcements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, message, type }) });
    setTitle(""); setMessage(""); setShowCreate(false); load();
  }
  async function toggle(id: string, active: boolean) {
    await fetch("/api/admin/announcements", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, active: !active }) }); load();
  }
  async function remove(id: string) {
    if (!confirm("Delete?")) return;
    await fetch(`/api/admin/announcements?id=${id}`, { method: "DELETE" }); load();
  }

  const tc: Record<string, string> = { info: "bg-blue-500/20 text-blue-400", warning: "bg-yellow-500/20 text-yellow-400", maintenance: "bg-purple-500/20 text-purple-400" };

  return (
    <div>
      <div className="flex items-center justify-between mb-6"><h1 className="font-display text-xl font-bold text-white">Broadcast Messages</h1><button onClick={() => setShowCreate(!showCreate)} className="cyber-btn-primary text-xs">+ New Broadcast</button></div>
      {showCreate && (
        <div className="cyber-card mb-4 space-y-3">
          <input className="cyber-input w-full text-sm" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
          <textarea className="cyber-input w-full text-sm h-16 resize-none" placeholder="Message" value={message} onChange={e => setMessage(e.target.value)} />
          <div className="flex gap-2">
            <select className="cyber-input text-sm" value={type} onChange={e => setType(e.target.value)}><option value="info">Info</option><option value="warning">Warning</option><option value="maintenance">Maintenance</option></select>
            <button onClick={create} className="cyber-btn-primary text-xs">Publish</button>
          </div>
        </div>
      )}
      {items.length === 0 ? <div className="cyber-card text-center py-8"><p className="text-gray-500 text-sm">No broadcast messages yet</p></div> :
        <div className="space-y-2">{items.map(i => (
          <div key={i.id} className={`cyber-card flex items-center justify-between ${!i.active ? "opacity-50" : ""}`}>
            <div>
              <div className="flex items-center gap-2"><span className={`cyber-badge text-xs ${tc[i.type] || tc.info}`}>{i.type}</span><p className="text-white text-sm font-medium">{i.title}</p></div>
              <p className="text-gray-500 text-xs mt-1">{i.message}</p>
              <p className="text-gray-600 text-xs mt-1">{new Date(i.created_at).toLocaleDateString("en-GB")}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => toggle(i.id, i.active)} className="cyber-btn-secondary text-xs">{i.active ? "Hide" : "Show"}</button>
              <button onClick={() => remove(i.id)} className="text-red-400/50 hover:text-red-400 text-xs">✕</button>
            </div>
          </div>
        ))}</div>
      }
    </div>
  );
}
