"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

const SLIDES = [
  {
    id: "title",
    render: () => (
      <div className="flex flex-col items-center justify-center h-full text-center px-6">
        <div className="w-20 h-20 rounded-2xl bg-[#00ffd5]/10 border border-[#00ffd5]/20 flex items-center justify-center mb-8 animate-pulse">
          <svg className="w-10 h-10" viewBox="0 0 120 120" fill="none"><path d="M60 14 L30 29 L26 74 L60 104 L94 74 L90 29 Z" fill="rgba(0,255,213,0.06)" stroke="#00ffd5" strokeWidth="2"/><path d="M51 56 L57 63 L70 48" fill="none" stroke="#00ffd5" strokeWidth="3" strokeLinecap="square"/></svg>
        </div>
        <h1 className="font-mono font-extrabold tracking-wider text-4xl sm:text-5xl lg:text-6xl mb-4">
          <span className="text-gray-100">THREAT</span><span className="text-[#00ffd5]">CAST</span>
        </h1>
        <p className="text-gray-400 text-lg sm:text-xl max-w-xl">AI-Powered Cybersecurity Tabletop Exercises</p>
        <p className="text-gray-600 text-sm mt-6 max-w-lg">Replace £30k consultancy exercises with unlimited, AI-generated incident simulations tailored to your organisation.</p>
        <p className="text-[#00ffd5] text-xs font-mono mt-10 animate-bounce">↓ Scroll or press →</p>
      </div>
    ),
  },
  {
    id: "problem",
    render: () => (
      <div className="flex flex-col justify-center h-full px-6 sm:px-12 max-w-4xl mx-auto">
        <p className="text-[#00ffd5] text-xs font-mono uppercase tracking-widest mb-3">The Problem</p>
        <h2 className="text-white text-3xl sm:text-4xl font-bold mb-4">Most tabletop exercises are theatre.</h2>
        <p className="text-gray-500 text-sm mb-10">Same recycled scenario. Same consultancy. Same £30k invoice. Nobody learns because nobody&apos;s invested.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { stat: "£30k+", label: "Average cost of a single consultancy-led TTX" },
            { stat: "78%", label: "of organisations exercise less than once a year" },
            { stat: "0", label: "exercises reference YOUR actual security tools" },
            { stat: "2 hrs", label: "of board time wasted on generic, recycled scenarios" },
          ].map((p, i) => (
            <div key={i} className="bg-[#0f1729] border border-white/5 rounded-xl p-5 flex items-center gap-4" style={{ animationDelay: `${i * 0.15}s` }}>
              <span className="text-[#00ffd5] font-mono text-2xl sm:text-3xl font-bold whitespace-nowrap"><AnimatedStat value={p.stat} /></span>
              <span className="text-gray-400 text-sm">{p.label}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "solution",
    render: () => (
      <div className="flex flex-col justify-center h-full px-6 sm:px-12 max-w-4xl mx-auto">
        <p className="text-[#00ffd5] text-xs font-mono uppercase tracking-widest mb-3">The Solution</p>
        <h2 className="text-white text-3xl sm:text-4xl font-bold mb-4">AI that knows your environment.</h2>
        <p className="text-gray-500 text-sm mb-10">ThreatCast generates unlimited, realistic exercises tailored to your org, your tools, and your threat landscape.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { icon: "⚡", title: "AI-Generated Scenarios", desc: "Claude Sonnet crafts unique incidents using your industry, tools, and org structure." },
            { icon: "🔌", title: "SIEM/XDR Integration", desc: "CrowdStrike, Defender, Splunk, Elastic, Taegis, Tenable, Cortex XDR." },
            { icon: "👥", title: "Real-Time Multiplayer", desc: "Team exercises with live scoring, lobby system, and instant leaderboard." },
            { icon: "📊", title: "MITRE ATT&CK Mapping", desc: "Every question maps to techniques. Visual heatmap shows coverage gaps." },
          ].map((f, i) => (
            <div key={i} className="bg-[#0f1729] border border-white/5 rounded-xl p-5">
              <span className="text-2xl">{f.icon}</span>
              <h3 className="text-white text-sm font-semibold mt-2">{f.title}</h3>
              <p className="text-gray-500 text-xs mt-1 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "how",
    render: () => (
      <div className="flex flex-col justify-center h-full px-6 sm:px-12 max-w-4xl mx-auto">
        <p className="text-[#00ffd5] text-xs font-mono uppercase tracking-widest mb-3">How It Works</p>
        <h2 className="text-white text-3xl sm:text-4xl font-bold mb-10">Four steps to better incident response.</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { num: "01", title: "Connect", desc: "Link your SIEM, set up your company profile, onboard in 60 seconds." },
            { num: "02", title: "Train", desc: "Daily drills, weekly challenges, full exercises. Solo or multiplayer." },
            { num: "03", title: "Track", desc: "XP, streaks, leaderboards, MITRE coverage, compliance evidence." },
            { num: "04", title: "Improve", desc: "AI adapts to gaps. Playbooks generated. Certificates earned." },
          ].map((s, i) => (
            <div key={i} className="bg-[#0f1729] border border-white/5 rounded-xl p-5 text-center">
              <span className="font-mono text-3xl font-bold text-[#00ffd5]/30">{s.num}</span>
              <h3 className="text-white text-sm font-bold mt-2">{s.title}</h3>
              <p className="text-gray-500 text-xs mt-2 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "engage",
    render: () => (
      <div className="flex flex-col justify-center h-full px-6 sm:px-12 max-w-4xl mx-auto">
        <p className="text-[#00ffd5] text-xs font-mono uppercase tracking-widest mb-3">Engagement</p>
        <h2 className="text-white text-3xl sm:text-4xl font-bold mb-10">Duolingo for incident response.</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { icon: "⚡", title: "Daily Drill", desc: "3 questions, 2 minutes. AI targets your weakest areas." },
            { icon: "⚔️", title: "Duels", desc: "Head-to-head. 5 questions. Same Qs. Winner takes glory." },
            { icon: "🏅", title: "Weekly Challenge", desc: "Platform-wide competition. New theme every Monday." },
            { icon: "🏆", title: "Certificates", desc: "PDF certs with 1-year expiry. Auditor-ready." },
            { icon: "🔥", title: "XP & Streaks", desc: "Recruit → Elite Defender. Miss a day, lose your streak." },
            { icon: "📋", title: "Compliance", desc: "ISO 27001, NIST, SOC 2, NIS2, DORA, PCI DSS 4.0." },
          ].map((e, i) => (
            <div key={i} className="bg-[#0f1729] border border-white/5 rounded-xl p-4">
              <span className="text-xl">{e.icon}</span>
              <h3 className="text-white text-xs font-semibold mt-2">{e.title}</h3>
              <p className="text-gray-500 text-[11px] mt-1 leading-relaxed">{e.desc}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "pricing",
    render: () => (
      <div className="flex flex-col justify-center h-full px-6 sm:px-12 max-w-4xl mx-auto">
        <p className="text-[#00ffd5] text-xs font-mono uppercase tracking-widest mb-3">Pricing</p>
        <h2 className="text-white text-3xl sm:text-4xl font-bold mb-4">Start free. Scale as you grow.</h2>
        <p className="text-gray-500 text-sm mb-8">All plans include AI scenarios, MITRE mapping, certificates, XP.</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { name: "Starter", price: "£99", features: ["10 users", "10 exercises/mo", "Daily drills", "Certificates"] },
            { name: "Growth", price: "£249", popular: true, features: ["25 users", "25 exercises/mo", "SIEM integration", "Custom branding"] },
            { name: "Professional", price: "£499", features: ["50 users", "Unlimited", "BYOK AI", "API access"] },
            { name: "Enterprise", price: "£999", features: ["Unlimited", "SAML SSO", "BYOK any provider", "SLA guarantee"] },
          ].map((p, i) => (
            <div key={i} className={"bg-[#0f1729] rounded-xl p-4 border " + (p.popular ? "border-[#00ffd5]/40" : "border-white/5")}>
              {p.popular && <span className="text-[#00ffd5] text-[9px] font-mono uppercase tracking-wider">Most Popular</span>}
              <h3 className="text-white text-sm font-bold mt-1">{p.name}</h3>
              <p className="text-[#00ffd5] font-mono text-xl font-bold mt-1">{p.price}<span className="text-gray-600 text-xs font-normal">/mo</span></p>
              <div className="mt-3 space-y-1.5">
                {p.features.map((f, fi) => (
                  <p key={fi} className="text-gray-400 text-[11px] flex items-center gap-1.5"><span className="text-[#00ffd5] text-[10px]">✓</span>{f}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "roi",
    render: () => (
      <div className="flex flex-col justify-center h-full px-6 sm:px-12 max-w-4xl mx-auto">
        <p className="text-[#00ffd5] text-xs font-mono uppercase tracking-widest mb-3">ROI</p>
        <h2 className="text-white text-3xl sm:text-4xl font-bold mb-10">The numbers speak.</h2>
        <div className="space-y-5">
          {[
            { stat: "90%", label: "cheaper than consultancy", sub: "£249/mo vs £30,000 per exercise" },
            { stat: "50×", label: "more exercises per year", sub: "Weekly drills vs annual one-off" },
            { stat: "$4.88M", label: "average data breach cost", sub: "One prevented incident pays for 40 years of ThreatCast — IBM 2024" },
          ].map((r, i) => (
            <div key={i} className="bg-[#0f1729] border border-white/5 rounded-xl p-6 flex items-center gap-6">
              <span className="text-[#00ffd5] font-mono text-4xl sm:text-5xl font-bold whitespace-nowrap"><AnimatedStat value={r.stat} /></span>
              <div>
                <p className="text-white text-base font-semibold">{r.label}</p>
                <p className="text-gray-500 text-xs mt-1">{r.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: "cta",
    render: () => (
      <div className="flex flex-col items-center justify-center h-full text-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-[#00ffd5]/10 border border-[#00ffd5]/20 flex items-center justify-center mb-6">
          <svg className="w-8 h-8" viewBox="0 0 120 120" fill="none"><path d="M60 14 L30 29 L26 74 L60 104 L94 74 L90 29 Z" fill="rgba(0,255,213,0.06)" stroke="#00ffd5" strokeWidth="2"/><path d="M51 56 L57 63 L70 48" fill="none" stroke="#00ffd5" strokeWidth="3" strokeLinecap="square"/></svg>
        </div>
        <h1 className="font-mono font-extrabold tracking-wider text-3xl sm:text-4xl mb-4">
          <span className="text-gray-100">THREAT</span><span className="text-[#00ffd5]">CAST</span>
        </h1>
        <p className="text-white text-xl font-semibold mb-2">Ready to level up your incident response?</p>
        <p className="text-gray-500 text-sm mb-8">Start with 5 free exercises. No credit card required.</p>
        <Link href="/sign-up" className="inline-block bg-[#00ffd5] text-[#030712] font-mono font-bold text-base px-8 py-3 rounded-lg hover:bg-[#00ffd5]/90 transition-all">
          Start Free Trial →
        </Link>
        <p className="text-gray-600 text-xs mt-6">hello@threatcast.io · threatcast.io · Glasgow, Scotland</p>
      </div>
    ),
  },
];

function AnimatedStat({ value, suffix = "" }: { value: string; suffix?: string }) {
  const [display, setDisplay] = useState("0");
  const num = parseInt(value.replace(/[^0-9]/g, ""));
  const prefix = value.match(/^[^0-9]*/)?.[0] || "";

  useEffect(() => {
    if (isNaN(num)) { setDisplay(value); return; }
    let start = 0;
    const duration = 1200;
    const startTime = Date.now();
    function tick() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      start = Math.round(num * eased);
      setDisplay(prefix + start.toLocaleString() + suffix);
      if (progress < 1) requestAnimationFrame(tick);
    }
    const timer = setTimeout(tick, 300);
    return () => clearTimeout(timer);
  }, [num, prefix, suffix, value]);

  return <>{display}</>;
}

function Particles() {
  const [dots, setDots] = useState<{x: number; y: number; size: number; speed: number; opacity: number}[]>([]);
  useEffect(() => {
    setDots(Array.from({ length: 30 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 20 + 10,
      opacity: Math.random() * 0.3 + 0.1,
    })));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {dots.map((d, i) => (
        <div key={i} className="absolute rounded-full bg-[#00ffd5]" style={{
          left: d.x + "%", top: d.y + "%",
          width: d.size + "px", height: d.size + "px",
          opacity: d.opacity,
          animation: `float ${d.speed}s linear infinite`,
        }} />
      ))}
      <style>{`@keyframes float { 0% { transform: translateY(0); } 50% { transform: translateY(-20px); } 100% { transform: translateY(0); } }`}</style>
    </div>
  );
}

export default function PitchPage() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0); // -1 up, 1 down, 0 initial

  const goTo = useCallback((idx: number) => {
    if (idx < 0 || idx >= SLIDES.length || idx === current) return;
    setDirection(idx > current ? 1 : -1);
    setCurrent(idx);
  }, [current]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowDown" || e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); goTo(current + 1); }
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); goTo(current - 1); }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [current, goTo]);

  // Touch / scroll
  useEffect(() => {
    let startY = 0;
    let lastNav = 0;
    function onTouchStart(e: TouchEvent) { startY = e.touches[0].clientY; }
    function onTouchEnd(e: TouchEvent) {
      const diff = startY - e.changedTouches[0].clientY;
      const now = Date.now();
      if (now - lastNav < 400) return;
      if (diff > 50) { goTo(current + 1); lastNav = now; }
      if (diff < -50) { goTo(current - 1); lastNav = now; }
    }
    function onWheel(e: WheelEvent) {
      const now = Date.now();
      if (now - lastNav < 600) return;
      if (e.deltaY > 30) { goTo(current + 1); lastNav = now; }
      if (e.deltaY < -30) { goTo(current - 1); lastNav = now; }
    }
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("wheel", onWheel);
    };
  }, [current, goTo]);

  return (
    <div className="fixed inset-0 bg-[#030712] overflow-hidden">
      {/* Particles */}
      <Particles />

      {/* Subtle grid background */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(#00ffd5 1px, transparent 1px), linear-gradient(90deg, #00ffd5 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

      {/* Slide content */}
      <div
        key={current}
        className="relative z-10 h-full"
        style={{ animation: direction === 0 ? "none" : direction > 0 ? "slideUp 0.4s ease-out" : "slideDown 0.4s ease-out" }}
      >
        {SLIDES[current].render()}
      </div>

      {/* Progress dots — right side */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2">
        {SLIDES.map((_, i) => (
          <button key={i} onClick={() => goTo(i)} className={"w-2 h-2 rounded-full transition-all duration-300 " + (i === current ? "bg-[#00ffd5] h-6" : "bg-gray-700 hover:bg-gray-500")} />
        ))}
      </div>

      {/* Slide counter — bottom */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20">
        <span className="font-mono text-xs text-gray-600">{current + 1} / {SLIDES.length}</span>
      </div>

      {/* Nav hint */}
      {current < SLIDES.length - 1 && (
        <button onClick={() => goTo(current + 1)} className="fixed bottom-4 right-4 z-20 text-gray-700 hover:text-[#00ffd5] transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </button>
      )}

      {/* Back to site */}
      <Link href="/" className="fixed top-4 left-4 z-20 text-gray-700 hover:text-gray-400 text-xs font-mono transition-colors">← threatcast.io</Link>

      <style jsx>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-40px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
