"use client";
import { useState } from "react";

interface Announcement { id: string; title: string; message: string; type: "info" | "warning" | "maintenance"; active: boolean; createdAt: string; }

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([
    { id: "1", title: "Welcome to ThreatCast", message: "Run your first exercise to get started.", type: "info", active: true, createdAt: new Date().toISOString() },
  ]);
  const [title, setTitle] = useState(""); const [message, setMessage] = useState(""); const [type, setType] = useState<"info" | "warning" | "maintenance">("info");

  function addAnnouncement() {
    if (!title.trim() || !message.trim()) return;
    setAnnouncements(prev => [{ id: Date.now().toString(), title, message, type, active: true, createdAt: new Date().toISOString() }, ...prev]);
    setTitle(""); setMessage("");
  }

  const tc: Record<string, string> = { info: "border-l-blue-500", warning: "border-l-orange-500", maintenance: "border-l-yellow-500" };

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl sm:text-2xl font-bold text-white">Platform Announcements</h1><p className="text-gray-500 text-xs sm:text-sm mt-1">Visible as banners in client portals</p></div>

      <div className="cyber-card mb-6">
        <h2 className="text-white text-sm font-semibold mb-3">New Announcement</h2>
        <input className="cyber-input w-full mb-2" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
        <textarea className="cyber-input w-full mb-2 h-20 resize-none" placeholder="Message (shown in portal banner)" value={message} onChange={e => setMessage(e.target.value)} />
        <div className="flex items-center gap-3">
          <div className="flex gap-2">{(["info", "warning", "maintenance"] as const).map(t => (
            <button key={t} onClick={() => setType(t)} className={`text-xs px-3 py-1.5 rounded border transition-colors ${type === t ? "bg-cyber-600/15 border-cyber-500 text-cyber-400" : "bg-surface-0 border-surface-3 text-gray-400"}`}>{t}</button>
          ))}</div>
          <button onClick={addAnnouncement} className="cyber-btn-primary text-sm ml-auto">Publish</button>
        </div>
      </div>

      <div className="space-y-2">{announcements.map(a => (
        <div key={a.id} className={`cyber-card border-l-4 ${tc[a.type]}`}>
          <div className="flex items-center justify-between">
            <div><p className="text-white text-sm font-medium">{a.title}</p><p className="text-gray-400 text-xs mt-1">{a.message}</p></div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${a.active ? "bg-green-400" : "bg-gray-600"}`} />
              <button onClick={() => setAnnouncements(prev => prev.filter(x => x.id !== a.id))} className="text-gray-500 hover:text-red-400 text-xs">Remove</button>
            </div>
          </div>
        </div>
      ))}</div>
    </div>
  );
}
