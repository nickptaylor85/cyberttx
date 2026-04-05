"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function ReplayPage() {
  const params = useParams();
  const sessionId = params.id as string;
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/ttx/session/${sessionId}`).then(r => r.ok ? r.json() : null).then(d => { setSession(d); setLoading(false); }).catch(() => setLoading(false));
  }, [sessionId]);

  if (loading) return <p className="text-gray-500 text-center py-12">Loading replay...</p>;
  if (!session?.scenario) return <p className="text-red-400 text-center py-12">Exercise not found</p>;

  const scenario = session.scenario;
  const stages = scenario.stages || [];
  const myAnswers = session.participants?.[0]?.answers || [];

  return (
    <div className="max-w-3xl mx-auto">
      <Link href={`/portal/ttx/${sessionId}`} className="text-gray-500 text-xs hover:text-gray-300 mb-4 inline-block">← Back to results</Link>
      <h1 className="font-display text-xl font-bold text-white mb-2">{session.title} — Replay</h1>
      <p className="text-gray-500 text-sm mb-6">Review every question with correct answers and explanations</p>

      {stages.map((stage: any, si: number) => (
        <div key={si} className="mb-8">
          <h2 className="font-display text-base font-semibold text-cyber-400 mb-2">Stage {si + 1}: {stage.title}</h2>
          {stage.narrative && <p className="text-gray-400 text-sm mb-4 bg-surface-0 p-3 rounded-lg border-l-2 border-cyber-600/30">{stage.narrative}</p>}

          {(stage.questions || []).map((q: any, qi: number) => {
            const globalIdx = stages.slice(0, si).reduce((a: number, s: any) => a + (s.questions?.length || 0), 0) + qi;
            const myAnswer = myAnswers[globalIdx];
            const isCorrect = myAnswer?.isCorrect;

            return (
              <div key={qi} className={`cyber-card mb-3 border-l-4 ${isCorrect ? "border-l-green-500" : isCorrect === false ? "border-l-red-500" : "border-l-gray-600"}`}>
                <p className="text-white text-sm font-medium mb-3">Q{globalIdx + 1}: {q.question}</p>
                <div className="space-y-1.5 mb-3">{(q.options || []).map((opt: any, oi: number) => {
                  const letter = String.fromCharCode(65 + oi);
                  const isCorrectOpt = q.correctAnswer === letter;
                  const wasChosen = myAnswer?.selectedOption === letter;
                  return (
                    <div key={oi} className={`flex items-start gap-2 p-2 rounded text-xs ${isCorrectOpt ? "bg-green-500/10 border border-green-500/30" : wasChosen && !isCorrectOpt ? "bg-red-500/10 border border-red-500/30" : "bg-surface-0 border border-surface-3"}`}>
                      <span className={`font-bold ${isCorrectOpt ? "text-green-400" : wasChosen ? "text-red-400" : "text-gray-500"}`}>{letter}</span>
                      <span className={isCorrectOpt ? "text-green-300" : wasChosen ? "text-red-300" : "text-gray-400"}>{typeof opt === "string" ? opt : opt.text}</span>
                      {isCorrectOpt && <span className="text-green-400 ml-auto">✓</span>}
                      {wasChosen && !isCorrectOpt && <span className="text-red-400 ml-auto">✗</span>}
                    </div>
                  );
                })}</div>
                {q.explanation && <p className="text-gray-500 text-xs bg-surface-0 p-2 rounded"><span className="text-gray-400 font-semibold">Explanation:</span> {q.explanation}</p>}
              </div>
            );
          })}
        </div>
      ))}

      <div className="flex gap-3 mt-6">
        <a href={`/api/portal/certificate?sessionId=${sessionId}`} target="_blank" className="cyber-btn-primary text-sm">Download Certificate</a>
        <a href={`/api/portal/report?sessionId=${sessionId}`} target="_blank" className="cyber-btn-secondary text-sm">Executive Report</a>
      </div>
    </div>
  );
}
