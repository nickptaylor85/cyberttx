import Link from "next/link";
import { LogoMark, LogoWordmark } from "@/components/Logo";

export default function Home() {
  return (
    <div className="min-h-screen">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#00ffd5] focus:text-black focus:rounded">Skip to content</a>
      {/* Nav */}
      <nav aria-label="Main navigation" className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <Link href="/" className="flex items-center gap-2.5">
          <LogoMark size={36} />
          <LogoWordmark size="lg" />
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/sign-in" className="text-gray-400 text-sm hover:text-white">Sign In</Link>
          <Link href="/sign-up" className="cyber-btn-primary text-sm">Start Free →</Link>
        </div>
      </nav>

      {/* Hero */}
      <main id="main-content">
      <main id="main-content">
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="flex gap-2 justify-center mb-6 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyber-600/10 border border-cyber-600/20 text-cyber-400 text-xs"><span className="w-1.5 h-1.5 rounded-full bg-cyber-400 animate-pulse" /> Grounded in 60+ real breaches</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-600/10 border border-purple-600/20 text-purple-400 text-xs">Your actual SIEM alerts, not generic textbook</span>
        </div>
        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">Stop paying £30k<br />for <span className="text-cyber-400">one exercise</span></h1>
        <p className="text-gray-400 text-lg sm:text-xl mt-6 max-w-2xl mx-auto leading-relaxed">ThreatCast generates unlimited, AI-powered tabletop exercises tailored to your organisation, your security tools, and your threat landscape. Every scenario references real breaches. Every alert looks like your actual console.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
          <Link href="/sign-up" className="cyber-btn-primary px-8 py-3 text-base">Start Free — 5 Exercises →</Link>
          <Link href="/pitch" className="cyber-btn-secondary px-8 py-3 text-base">See the Pitch Deck</Link>
        </div>
        <p className="text-gray-600 text-xs mt-4">No credit card · No consultancy · No recycled scenarios</p>
      </section>

      {/* Killer stats */}
      <section className="max-w-4xl mx-auto px-6 pb-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { stat: "90%", label: "cheaper than consultancy" },
            { stat: "60+", label: "real breaches in the database" },
            { stat: "8", label: "SIEM/XDR platforms supported" },
            { stat: "6", label: "compliance frameworks mapped" },
          ].map((s, i) => (
            <div key={i} className="text-center py-4">
              <p className="font-display text-2xl sm:text-3xl font-bold text-cyber-400">{s.stat}</p>
              <p className="text-gray-500 text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why not consultancy */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="cyber-card bg-gradient-to-br from-red-500/5 to-transparent border-red-500/10">
          <h2 className="font-display text-lg font-bold text-white mb-4">Why consultancy TTX fails</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <p className="text-red-400 text-xs font-semibold mb-2">❌ Traditional consultancy</p>
              <div className="space-y-2 text-gray-500 text-xs">
                <p>£30k per exercise, once a year</p>
                <p>Generic scenario recycled across clients</p>
                <p>No reference to your actual tools</p>
                <p>2-hour boardroom theatre</p>
                <p>PDF report nobody reads</p>
              </div>
            </div>
            <div>
              <p className="text-cyber-400 text-xs font-semibold mb-2">✓ ThreatCast</p>
              <div className="space-y-2 text-gray-400 text-xs">
                <p>£99-499/mo, unlimited exercises</p>
                <p>AI generates unique scenarios every time</p>
                <p>Your Sentinel, Defender, CrowdStrike alerts</p>
                <p>Daily drills, duels, weekly challenges</p>
                <p>MITRE heatmap + compliance evidence + certificates</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Daily engagement */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="cyber-card text-center border-cyber-600/20 bg-gradient-to-b from-cyber-600/5 to-transparent">
            <p className="text-3xl mb-2">⚡</p>
            <h3 className="text-white text-sm font-semibold">Daily Drill</h3>
            <p className="text-gray-500 text-xs mt-1">3 questions, 2 minutes. Targets your weak spots.</p>
          </div>
          <div className="cyber-card text-center border-purple-600/20 bg-gradient-to-b from-purple-600/5 to-transparent">
            <p className="text-3xl mb-2">⚔️</p>
            <h3 className="text-white text-sm font-semibold">Head-to-Head Duels</h3>
            <p className="text-gray-500 text-xs mt-1">Challenge a teammate. 5 questions. Winner takes the glory.</p>
          </div>
          <div className="cyber-card text-center border-orange-600/20 bg-gradient-to-b from-orange-600/5 to-transparent">
            <p className="text-3xl mb-2">🏅</p>
            <h3 className="text-white text-sm font-semibold">Weekly Challenge + XP</h3>
            <p className="text-gray-500 text-xs mt-1">Compete platform-wide. Level up from Recruit to Elite Defender.</p>
          </div>
        </div>
      </section>

      {/* Features grid */}

      <section className="max-w-4xl mx-auto px-6 pb-12">
        <p className="text-gray-600 text-xs text-center mb-4 uppercase tracking-wider">Integrates with your security stack</p>
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">{[
          "CrowdStrike", "Microsoft Defender", "Splunk", "Elastic", "Taegis XDR", "Tenable", "Cortex XDR"
        ].map(name => (
          <span key={name} className="text-gray-500 text-sm font-medium hover:text-gray-300 transition-colors">{name}</span>
        ))}</div>
      </section>

      <section className="max-w-4xl mx-auto px-6 pb-12">
        <p className="text-gray-600 text-xs text-center mb-4 uppercase tracking-wider">Compliance frameworks mapped</p>
        <div className="flex flex-wrap justify-center gap-2">{[
          "MITRE ATT&CK", "ISO 27001", "NIST CSF", "SOC 2", "NIS2", "DORA", "PCI DSS 4.0"
        ].map(f => (
          <span key={f} className="px-3 py-1.5 rounded-lg bg-surface-2 border border-surface-3 text-gray-400 text-xs font-medium">{f}</span>
        ))}</div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-20">
        <h2 className="font-display text-2xl font-bold text-white text-center mb-2">Everything You Need</h2>
        <p className="text-gray-500 text-center text-sm mb-8">From 2-minute drills to board-level crisis simulations</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: "🎯", title: "AI-Generated Scenarios", desc: "Claude generates unique, realistic incidents tailored to your industry and tools. No two exercises are ever the same." },
            { icon: "🚨", title: "Live SIEM Integration", desc: "Connect CrowdStrike, Taegis, Defender, Splunk, Elastic, Tenable, Cortex XDR. Build exercises from real alerts." },
            { icon: "👥", title: "Real-Time Multiplayer", desc: "Run team exercises with live scoring, lobby system, and post-exercise leaderboard. See who answered in real time." },
            { icon: "⚔️", title: "Head-to-Head Duels", desc: "Challenge a teammate to a 5-question rapid-fire battle. Same questions, 75-second timer. Winner gets bonus XP." },
            { icon: "📊", title: "MITRE ATT&CK Heatmap", desc: "Track technique coverage visually. Hover for details. Identify gaps. Close them with targeted exercises." },
            { icon: "📋", title: "Playbook Generation", desc: "Every exercise generates an IR playbook. Export as PDF or Word. Auto-saved to your playbook library." },
            { icon: "🏆", title: "Certificates + Compliance", desc: "PDF certificates with 1-year expiry. Map to ISO 27001, NIST CSF, SOC 2, NIS2, DORA, PCI DSS 4.0." },
            { icon: "🧠", title: "Adaptive Difficulty", desc: "AI tracks your weak spots and targets daily drills to your gaps. Every question explanation links to the real-world incident it happened in." },
            { icon: "📆", title: "Training Campaigns", desc: "12-month calendar: Ransomware Month, Phishing Season, Cyber Awareness Month. One-click launch." },
            { icon: "✅", title: "Team Compliance", desc: "Traffic-light dashboard: who trained, who's at risk, who's overdue. Manager accountability built in." },
            { icon: "🔔", title: "Smart Notifications", desc: "Streak expiry alerts, daily question digests, teammate activity updates. Keeps teams engaged automatically." },
            { icon: "🎨", title: "White-Label Branding", desc: "Custom logo, name, colours. 'Powered by ThreatCast' footer. Your portal, your brand." },
          ].map(f => (
            <div key={f.title} className="cyber-card hover:border-cyber-600/30 transition-colors">
              <span className="text-2xl">{f.icon}</span>
              <h3 className="text-white text-sm font-semibold mt-2">{f.title}</h3>
              <p className="text-gray-500 text-xs mt-1 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <h2 className="font-display text-2xl font-bold text-white text-center mb-8">How It Works</h2>
        <div className="grid sm:grid-cols-4 gap-4">
          {[
            { step: "01", title: "Connect", desc: "Link your SIEM, set up your company profile, onboard in 60 seconds" },
            { step: "02", title: "Train", desc: "Daily drills, weekly challenges, full exercises. Solo or as a team." },
            { step: "03", title: "Track", desc: "XP levels, streaks, leaderboards, MITRE coverage, compliance evidence" },
            { step: "04", title: "Improve", desc: "AI adapts difficulty. Playbooks generated. Certificates earned." },
          ].map(s => (
            <div key={s.step} className="text-center">
              <span className="font-display text-3xl font-bold text-cyber-600/30">{s.step}</span>
              <h3 className="text-white text-sm font-semibold mt-1">{s.title}</h3>
              <p className="text-gray-500 text-xs mt-1">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="cyber-card border-surface-3 bg-gradient-to-br from-surface-2 to-transparent text-center">
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-4">Built for Security Teams</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div><p className="font-display text-xl font-bold text-white">SOC Analysts</p><p className="text-gray-500 text-xs mt-1">Sharpen triage skills daily</p></div>
            <div><p className="font-display text-xl font-bold text-white">IR Teams</p><p className="text-gray-500 text-xs mt-1">Practice real incident playbooks</p></div>
            <div><p className="font-display text-xl font-bold text-white">CISOs</p><p className="text-gray-500 text-xs mt-1">Compliance evidence on demand</p></div>
            <div><p className="font-display text-xl font-bold text-white">MSSPs</p><p className="text-gray-500 text-xs mt-1">White-label for your clients</p></div>
          </div>
        </div>
      </section>

      {/* Product Tour */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <h2 className="font-display text-2xl font-bold text-white text-center mb-2">See It In Action</h2>
        <p className="text-gray-500 text-center text-sm mb-8">From daily drills to full crisis simulations in 60 seconds</p>
        <div className="space-y-6">
          {[
            { step: "01", title: "AI generates a unique scenario", desc: "Pick a theme — ransomware, phishing, APT, insider threat. The AI builds a multi-stage incident narrative using your security tools, your industry, and real-world attack patterns. Every exercise references actual incidents like MOVEit, SolarWinds, and MGM.", tag: "Generation", color: "00ffd5" },
            { step: "02", title: "Your team plays through it live", desc: "Multiple-choice questions with realistic tool alerts, log excerpts, and timestamps. Multiplayer mode lets your whole SOC play simultaneously with live scoring. Solo mode works too — 2-minute daily drills build muscle memory.", tag: "Gameplay", color: "a78bfa" },
            { step: "03", title: "AI explains what you got wrong", desc: "Every answer includes a detailed explanation and a 'This Really Happened' reference linking to the real-world breach that used that exact technique. Your weak spots are tracked and tomorrow's drill targets them.", tag: "Learning", color: "f59e0b" },
            { step: "04", title: "Compliance evidence generates automatically", desc: "PDF certificates with 1-year expiry. MITRE ATT&CK coverage heatmap. Team compliance dashboard showing who trained, who's overdue. Mapped to ISO 27001, NIST CSF, SOC 2, NIS2, DORA, PCI DSS 4.0.", tag: "Compliance", color: "10b981" },
          ].map(t => (
            <div key={t.step} className="cyber-card hover:border-cyber-600/20 transition-colors flex gap-5 items-start">
              <span className="font-mono text-2xl font-bold text-[#00ffd5]/20 shrink-0">{t.step}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-white text-sm font-semibold">{t.title}</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full" style={{ background: `#${t.color}15`, color: `#${t.color}` }}>{t.tag}</span>
                </div>
                <p className="text-gray-500 text-xs leading-relaxed">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link href="/pitch" className="cyber-btn-secondary text-sm px-6 py-2 inline-block">View Full Pitch Deck →</Link>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-20" id="pricing">
        <h2 className="font-display text-2xl font-bold text-white text-center mb-2">Pricing</h2>
        <p className="text-gray-500 text-center text-sm mb-8">Start free. Scale as your team grows.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { plan: "Starter", price: "£99", features: ["10 users", "10 exercises/month", "Daily drills + challenges", "Duels + leaderboard", "Playbooks + certificates", "Email support"], cta: "Start Free" },
            { plan: "Growth", price: "£249", features: ["25 users", "25 exercises/month", "SIEM/XDR integration", "Custom branding", "Team compliance dashboard", "Adaptive difficulty", "Priority support"], popular: true, cta: "Start Free" },
            { plan: "Professional", price: "£499", features: ["50 users", "Unlimited exercises", "Custom characters", "API access", "SSO ready", "Benchmarking", "Slack + Teams bots", "BYOK AI (own API key)"], cta: "Start Free" },
            { plan: "Enterprise", price: "£999", features: ["Unlimited users", "Unlimited everything", "SAML SSO", "Feature flags", "Dedicated support", "Custom integrations", "SLA guarantee", "BYOK AI (multi-provider)"], cta: "Contact Us" },
          ].map(p => (
            <div key={p.plan} className={`cyber-card ${(p as any).popular ? "border-cyber-600/30 relative" : ""}`}>
              {(p as any).popular && <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 cyber-badge text-xs bg-cyber-600 text-white px-3">Most Popular</span>}
              <h3 className="text-white text-base font-semibold">{p.plan}</h3>
              <p className="font-display text-2xl font-bold text-cyber-400 mt-2">{p.price}<span className="text-gray-500 text-sm font-normal">/mo</span></p>
              <ul className="mt-4 space-y-2">{p.features.map(f => <li key={f} className="text-gray-400 text-xs flex items-center gap-2"><span className="text-cyber-400">✓</span>{f}</li>)}</ul>
              <Link href={p.cta === "Contact Us" ? "mailto:hello@threatcast.io" : "/sign-up"} className={`mt-4 w-full inline-block text-center text-sm py-2 rounded-lg ${(p as any).popular ? "cyber-btn-primary" : "cyber-btn-secondary"}`}>{p.cta}</Link>
            </div>
          ))}
        </div>
        <p className="text-gray-600 text-center text-xs mt-4">All plans include: AI scenario generation, real-world incident references, MITRE mapping, PDF exports, XP + streaks. Annual billing: 20% off.</p>
      </section>

      {/* Social proof placeholder */}
      <section className="max-w-4xl mx-auto px-6 pb-16 text-center">
        <div className="grid grid-cols-3 gap-6">
          <div><p className="font-display text-2xl font-bold text-cyber-400">90%</p><p className="text-gray-500 text-xs">cheaper than consultancy</p></div>
          <div><p className="font-display text-2xl font-bold text-cyber-400">2 min</p><p className="text-gray-500 text-xs">daily drill commitment</p></div>
          <div><p className="font-display text-2xl font-bold text-cyber-400">22</p><p className="text-gray-500 text-xs">real-world incidents</p></div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-6 pb-20 text-center">
        <div className="cyber-card border-cyber-600/20 bg-gradient-to-br from-cyber-600/5 to-transparent">
          <h2 className="font-display text-2xl font-bold text-white">Ready to level up your incident response?</h2>
          <p className="text-gray-400 text-sm mt-2">Start with 5 free exercises. No credit card required.</p>
          <Link href="/sign-up" className="cyber-btn-primary px-8 py-3 text-base mt-6 inline-block">Start Free Trial →</Link>
        </div>
      </section>

      {/* Footer */}
      </main>
      </main>
      <footer role="contentinfo" className="border-t border-surface-3 py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2"><LogoMark size={24} /><LogoWordmark size="sm" /></div>
          <div className="flex gap-4 text-gray-600 text-xs"><Link href="/terms" className="hover:text-gray-400">Terms</Link><Link href="/privacy" className="hover:text-gray-400">Privacy</Link>
          <Link href="/changelog" className="hover:text-gray-400">Changelog</Link>
          <Link href="/docs" className="hover:text-gray-400">API Docs</Link><a href="mailto:hello@threatcast.io" className="hover:text-gray-400">Contact</a></div>
          <p className="text-gray-700 text-xs">© 2026 ThreatCast. Glasgow, Scotland.</p>
        </div>
      </footer>
    </div>
  );
}
