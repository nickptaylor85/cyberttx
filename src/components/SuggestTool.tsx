"use client";
import { useState } from "react";

export default function SuggestTool() {
  const [tool, setTool] = useState(""); const [sent, setSent] = useState(false);
  return (
    <div className="cyber-card mt-6 border-dashed border-surface-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl">💡</span>
        <div className="flex-1">
          <h3 className="text-white text-sm font-semibold">Missing a tool?</h3>
          <p className="text-gray-500 text-xs mt-1 mb-3">Suggest a security tool and we&apos;ll add it to the platform.</p>
          {sent ? <p className="text-green-400 text-sm">Thanks! We&apos;ll review your suggestion.</p> : (
            <div className="flex gap-2">
              <input className="cyber-input flex-1 text-sm" placeholder="e.g. Wiz, Rapid7, SentinelOne..." value={tool} onChange={e => setTool(e.target.value)} />
              <button onClick={async () => { if (!tool.trim()) return; await fetch("/api/support", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: "Tool suggestion: " + tool }) }).catch(() => {}); setSent(true); setTool(""); setTimeout(() => setSent(false), 5000); }} disabled={!tool.trim()} className="cyber-btn-primary text-xs disabled:opacity-50">Suggest</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
