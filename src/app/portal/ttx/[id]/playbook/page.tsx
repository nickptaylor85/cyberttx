"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface PlaybookSection { title: string; content: string; actions: string[]; }
interface Playbook { title: string; generatedFrom: string; theme: string; sections: PlaybookSection[]; mitreTechniques: string[]; }

export default function PlaybookPage() {
  const params = useParams();
  const sessionId = params.id as string;
  const [playbook, setPlaybook] = useState<Playbook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/portal/playbook/${sessionId}`, { method: "POST" })
      .then(r => {
        if (!r.ok) throw new Error("Failed to generate playbook");
        return r.json();
      })
      .then(setPlaybook)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="relative flex h-4 w-4 mx-auto mb-3"><span className="animate-ping absolute h-full w-full rounded-full bg-cyber-400 opacity-75"></span><span className="relative rounded-full h-4 w-4 bg-cyber-500"></span></div>
        <p className="text-gray-500 text-sm">Generating playbook...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="max-w-lg mx-auto text-center py-20">
      <p className="text-red-400 mb-4">{error}</p>
      <Link href={`/portal/ttx/${sessionId}`} className="cyber-btn-secondary text-sm">← Back to Exercise</Link>
    </div>
  );

  if (!playbook) return null;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-xl font-bold text-white">{playbook.title}</h1>
          <p className="text-gray-500 text-xs mt-1">Generated from: {playbook.generatedFrom} · {playbook.theme}</p>
        </div>
        <Link href={`/portal/ttx/${sessionId}`} className="cyber-btn-secondary text-sm">← Back</Link>
      </div>

      {playbook.mitreTechniques.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {playbook.mitreTechniques.map(t => <span key={t} className="cyber-badge text-xs bg-cyber-600/10 text-cyber-400">{t}</span>)}
        </div>
      )}

      <div className="space-y-4">
        {playbook.sections.map((section, i) => (
          <div key={i} className="cyber-card">
            <h2 className="text-white text-sm font-semibold mb-2">{section.title}</h2>
            {section.content && <p className="text-gray-400 text-sm leading-relaxed mb-3">{section.content}</p>}
            {section.actions.length > 0 && (
              <div className="space-y-2">
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Response Actions</p>
                {section.actions.map((action, j) => (
                  <div key={j} className="flex items-start gap-2 pl-3 border-l-2 border-cyber-600/30 py-1">
                    <span className="text-cyber-400 text-xs mt-0.5">→</span>
                    <p className="text-gray-300 text-xs leading-relaxed">{action}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-6">
        <button onClick={() => { navigator.clipboard.writeText(playbook.sections.map(s => `${s.title}\n${s.content}\n\n${s.actions.map(a => "• " + a).join("\n")}`).join("\n\n")); }} className="cyber-btn-secondary text-sm">📋 Copy as Text</button>
        <Link href={`/portal/ttx/${sessionId}`} className="cyber-btn-secondary text-sm">← Back to Exercise</Link>
      </div>
    </div>
  );
}
