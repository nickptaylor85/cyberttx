"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [industry, setIndustry] = useState("");
  const [size, setSize] = useState("");
  const [tools, setTools] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const industries = ["Technology", "Financial Services", "Healthcare", "Manufacturing", "Retail", "Energy & Utilities", "Government", "Education", "Professional Services", "Media & Entertainment", "Telecommunications", "Other"];
  const sizes = ["1-10", "11-50", "50-200", "200-1000", "1000-5000", "5000+"];
  const secTools = ["CrowdStrike", "Microsoft Defender", "Secureworks Taegis", "Splunk", "Elastic", "Tenable", "Palo Alto", "SentinelOne", "Carbon Black", "Wiz", "Rapid7", "Fortinet", "Zscaler", "Cisco"];

  async function complete() {
    setSaving(true);
    // Save company profile
    await fetch("/api/portal/profile", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ industry, companySize: size, securityTools: tools }),
    }).catch(() => {});
    // Mark onboarding as done
    localStorage.setItem("tc_onboarded", "true");
    router.push("/portal/ttx");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex gap-1 mb-8">{[1, 2, 3, 4].map(s => (
          <div key={s} className={`h-1 flex-1 rounded-full ${s <= step ? "bg-cyber-500" : "bg-surface-3"}`} />
        ))}</div>

        {step === 1 && (
          <div className="cyber-card text-center py-8">
            <p className="text-4xl mb-4">🛡️</p>
            <h1 className="font-display text-2xl font-bold text-white mb-2">Welcome to ThreatCast</h1>
            <p className="text-gray-400 text-sm mb-6">Let&apos;s set up your portal in 60 seconds.</p>
            <button onClick={() => setStep(2)} className="cyber-btn-primary px-8 py-3">Let&apos;s Go →</button>
          </div>
        )}

        {step === 2 && (
          <div className="cyber-card">
            <h2 className="font-display text-lg font-bold text-white mb-2">Your Industry</h2>
            <p className="text-gray-500 text-xs mb-4">This helps the AI generate relevant scenarios for your sector.</p>
            <div className="grid grid-cols-2 gap-2">{industries.map(i => (
              <button key={i} onClick={() => { setIndustry(i); setStep(3); }} className={`p-3 rounded-lg border text-sm text-left transition-colors ${industry === i ? "border-cyber-500 bg-cyber-500/10 text-white" : "border-surface-3 text-gray-400 hover:border-surface-4"}`}>{i}</button>
            ))}</div>
          </div>
        )}

        {step === 3 && (
          <div className="cyber-card">
            <h2 className="font-display text-lg font-bold text-white mb-2">Company Size</h2>
            <p className="text-gray-500 text-xs mb-4">Helps us tailor exercise complexity and team features.</p>
            <div className="grid grid-cols-3 gap-2">{sizes.map(s => (
              <button key={s} onClick={() => { setSize(s); setStep(4); }} className={`p-3 rounded-lg border text-sm text-center transition-colors ${size === s ? "border-cyber-500 bg-cyber-500/10 text-white" : "border-surface-3 text-gray-400 hover:border-surface-4"}`}>{s}</button>
            ))}</div>
          </div>
        )}

        {step === 4 && (
          <div className="cyber-card">
            <h2 className="font-display text-lg font-bold text-white mb-2">Your Security Stack</h2>
            <p className="text-gray-500 text-xs mb-4">Select the tools your team uses. The AI will reference them in scenarios. You can change this later.</p>
            <div className="flex flex-wrap gap-2 mb-4">{secTools.map(t => (
              <button key={t} onClick={() => setTools(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])} className={`px-3 py-1.5 rounded-lg border text-xs transition-colors ${tools.includes(t) ? "border-cyber-500 bg-cyber-500/10 text-cyber-400" : "border-surface-3 text-gray-500 hover:border-surface-4"}`}>{t}</button>
            ))}</div>
            <button onClick={complete} disabled={saving} className="cyber-btn-primary w-full py-3 disabled:opacity-50">
              {saving ? "Setting up..." : "Launch My Portal 🚀"}
            </button>
            <button onClick={complete} className="text-gray-500 text-xs mt-2 w-full text-center">Skip for now</button>
          </div>
        )}
      </div>
    </div>
  );
}
