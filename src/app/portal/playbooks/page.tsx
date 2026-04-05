"use client";
import { useState, useEffect } from "react";
export default function PlaybooksPage() {
  const [pbs, setPbs] = useState<any[]>([]); const [loading, setLoading] = useState(true);
  useEffect(() => { fetch("/api/portal/playbooks").then(r => r.ok ? r.json() : []).then(setPbs).finally(() => setLoading(false)); }, []);
  async function remove(id: string) { if (!confirm("Delete?")) return; await fetch("/api/portal/playbooks?id=" + id, { method: "DELETE" }); setPbs(pbs.filter(p => p.id !== id)); }
  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl sm:text-2xl font-bold text-white">Playbook Library</h1><p className="text-gray-500 text-xs sm:text-sm mt-1">Saved IR playbooks from exercises</p></div>
      {loading ? <p className="text-gray-500 text-center py-12">Loading...</p> : pbs.length === 0 ? <div className="cyber-card text-center py-12"><p className="text-gray-400">No playbooks yet. Complete an exercise to generate one.</p></div> :
      <div className="space-y-2">{pbs.map((p: any) => <div key={p.id} className="cyber-card flex items-center justify-between"><div><p className="text-white text-sm">{p.title}</p><span className="text-gray-500 text-xs">{p.framework} · {new Date(p.createdAt).toLocaleDateString()}</span></div><button onClick={() => remove(p.id)} className="cyber-btn-secondary text-xs">Delete</button></div>)}</div>}
    </div>
  );
}
