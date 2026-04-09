"use client";
import { useState, useEffect, useCallback } from "react";

const QUESTIONS = [
  { q: "What does MITRE ATT&CK stand for?", a: ["Adversarial Tactics, Techniques & Common Knowledge", "Advanced Threat Testing & Cyber Knowledge", "Automated Threat Tracking & Classification Kit"], correct: 0 },
  { q: "Which port does HTTPS use by default?", a: ["443", "80", "8080"], correct: 0 },
  { q: "What type of attack is 'credential stuffing'?", a: ["Using stolen credentials across multiple sites", "Brute-forcing a single password", "Injecting SQL into login forms"], correct: 0 },
  { q: "What is a 'Golden Ticket' attack?", a: ["Forging Kerberos TGTs with the KRBTGT hash", "Stealing session cookies from a browser", "Exploiting a zero-day in Active Directory"], correct: 0 },
  { q: "In the CIA triad, what does the 'A' stand for?", a: ["Availability", "Authentication", "Authorisation"], correct: 0 },
  { q: "What year was the SolarWinds Orion breach discovered?", a: ["2020", "2019", "2021"], correct: 0 },
  { q: "What is a 'living off the land' attack?", a: ["Using legitimate system tools for malicious purposes", "Hiding malware in agricultural IoT devices", "Exploiting physical access to data centres"], correct: 0 },
  { q: "What does EDR stand for?", a: ["Endpoint Detection and Response", "Enterprise Data Recovery", "External Defence Router"], correct: 0 },
  { q: "Which framework uses Tactics, Techniques, and Procedures (TTPs)?", a: ["MITRE ATT&CK", "NIST CSF", "ISO 27001"], correct: 0 },
  { q: "What is the default timeout for a Kerberos TGT?", a: ["10 hours", "24 hours", "1 hour"], correct: 0 },
  { q: "Which ransomware group attacked the NHS via Synnovis in 2024?", a: ["Qilin", "LockBit", "BlackCat"], correct: 0 },
  { q: "What does SIEM stand for?", a: ["Security Information and Event Management", "System Intrusion and Endpoint Monitoring", "Secure Infrastructure Event Manager"], correct: 0 },
  { q: "What is the average cost of a data breach in 2024 (IBM)?", a: ["$4.88 million", "$2.5 million", "$7.2 million"], correct: 0 },
  { q: "What type of attack exploits the human element?", a: ["Social engineering", "Buffer overflow", "DNS poisoning"], correct: 0 },
  { q: "Which technique involves moving between systems in a network?", a: ["Lateral movement", "Privilege escalation", "Data exfiltration"], correct: 0 },
];

// Shuffle answers for each question at load time
function shuffleQuestion(q: typeof QUESTIONS[0]) {
  const indices = [0, 1, 2];
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  return {
    q: q.q,
    a: indices.map(i => q.a[i]),
    correct: indices.indexOf(q.correct),
  };
}

export default function CyberTrivia({ onScore }: { onScore?: (correct: boolean) => void }) {
  const [questions] = useState(() => {
    const shuffled = [...QUESTIONS].sort(() => Math.random() - 0.5);
    return shuffled.map(shuffleQuestion);
  });
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const current = questions[qIdx % questions.length];

  const handleAnswer = useCallback((idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    setShowResult(true);
    setTotal(t => t + 1);
    const isCorrect = idx === current.correct;
    if (isCorrect) setScore(s => s + 1);
    onScore?.(isCorrect);

    setTimeout(() => {
      setSelected(null);
      setShowResult(false);
      setQIdx(i => i + 1);
    }, 1500);
  }, [selected, current.correct, onScore]);

  return (
    <div className="w-full max-w-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[#00ffd5] text-xs font-mono font-bold">⚡ CYBER TRIVIA</span>
          <span className="text-gray-600 text-[10px]">while you wait</span>
        </div>
        <span className="text-[#00ffd5] font-mono text-xs">{score}/{total}</span>
      </div>

      {/* Question */}
      <div className="bg-[#0a0a1a] border border-white/5 rounded-lg p-4 mb-3">
        <p className="text-white text-sm font-medium leading-relaxed">{current.q}</p>
      </div>

      {/* Answers */}
      <div className="space-y-2">
        {current.a.map((answer, i) => {
          let style = "border-white/5 bg-[#0f1729] hover:border-[#00ffd5]/30 hover:bg-[#00ffd5]/5 cursor-pointer";
          if (showResult && i === current.correct) {
            style = "border-[#00ffd5]/50 bg-[#00ffd5]/10";
          } else if (showResult && i === selected && i !== current.correct) {
            style = "border-red-500/50 bg-red-500/10";
          } else if (selected !== null) {
            style = "border-white/5 bg-[#0f1729] opacity-50 cursor-default";
          }

          return (
            <button
              key={i}
              onClick={() => handleAnswer(i)}
              disabled={selected !== null}
              className={"w-full text-left p-3 rounded-lg border transition-all text-sm " + style}
            >
              <span className="text-gray-500 font-mono text-xs mr-2">{String.fromCharCode(65 + i)}</span>
              <span className={showResult && i === current.correct ? "text-[#00ffd5]" : showResult && i === selected ? "text-red-400" : "text-gray-300"}>
                {answer}
              </span>
              {showResult && i === current.correct && <span className="float-right text-[#00ffd5]">✓</span>}
              {showResult && i === selected && i !== current.correct && <span className="float-right text-red-400">✗</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
