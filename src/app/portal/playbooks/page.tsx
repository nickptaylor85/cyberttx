"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

interface SavedPlaybook { id: string; session_id: string; title: string; theme: string; created_at: string; }

export default function PlaybooksPage() {
  const [playbooks, setPlaybooks] = useState<SavedPlaybook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portal/playbooks").then(r => r.ok ? r.json() : []).then(setPlaybooks).finally(() => setLoading(false));
  }, []);

  async function remove(id: string) {
    if (!confirm("Delete this playbook?")) return;
    await fetch(`/api/portal/playbooks?id=${id}`, { method: "DELETE" });
    setPlaybooks(p => p.filter(x => x.id !== id));
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-xl sm:text-2xl font-bold text-white">Playbook Library</h1>
        <p className="text-gray-500 text-xs mt-1">{playbooks.length} saved playbooks · Auto-saved when you view a playbook from an exercise</p>
      </div>

      {loading ? <p className="text-gray-500 text-center py-12">Loading...</p> :
        playbooks.length === 0 ? (
          <div className="cyber-card text-center py-12">
            <p className="text-3xl mb-3">📋</p>
            <p className="text-gray-400 text-sm">No playbooks saved yet</p>
            <p className="text-gray-500 text-xs mt-1">Complete an exercise and click &quot;Playbook&quot; to generate and auto-save one</p>
          </div>
        ) : (
          <div className="space-y-2">{playbooks.map(pb => (
            <div key={pb.id} className="cyber-card flex items-center justify-between">
              <div className="min-w-0 mr-3">
                <p className="text-white text-sm font-medium truncate">{pb.title}</p>
                <p className="text-gray-500 text-xs">{pb.theme} · Saved {new Date(pb.created_at).toLocaleDateString("en-GB")}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link href={`/portal/ttx/${pb.session_id}/playbook`} className="cyber-btn-secondary text-xs">View</Link>
                <a href={`/api/portal/playbook/${pb.session_id}/pdf`} className="cyber-btn-secondary text-xs">PDF</a>
                <a href={`/api/portal/playbook/${pb.session_id}/docx`} className="cyber-btn-secondary text-xs">Word</a>
                <button onClick={() => remove(pb.id)} className="text-red-400/50 hover:text-red-400 text-xs p-1">✕</button>
              </div>
            </div>
          ))}</div>
        )
      }
    </div>
  );
}
