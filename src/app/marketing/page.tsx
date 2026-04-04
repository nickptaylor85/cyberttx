import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-0 cyber-grid-bg relative overflow-hidden">
      {/* Ambient glow effects */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyber-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-10 border-b border-surface-3/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyber-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <span className="font-display text-xl font-bold text-white">
              Cyber<span className="text-cyber-400">TTX</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
            <Link href="#features" className="hover:text-white transition-colors">Features</Link>
            <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/sign-in" className="hover:text-white transition-colors">Sign In</Link>
            <Link href="/sign-up" className="cyber-btn-primary text-sm">Start Free Trial</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyber-600/10 border border-cyber-600/20 text-cyber-400 text-sm font-medium mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyber-500"></span>
            </span>
            AI-Powered Security Training
          </div>

          <h1 className="font-display text-5xl md:text-7xl font-bold text-white leading-[1.1] mb-6">
            Tabletop exercises that
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyber-400 via-cyan-400 to-blue-400">
              feel dangerously real
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            AI generates realistic incident scenarios tailored to your security stack. 
            Run real-time multiplayer TTX sessions. Score, compete, and sharpen your team&apos;s 
            incident response — aligned to MITRE ATT&CK.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/sign-up" className="cyber-btn-primary text-base px-8 py-3">
              Start Free — No Card Required
            </Link>
            <Link href="#demo" className="cyber-btn-secondary text-base px-8 py-3">
              Watch Demo
            </Link>
          </div>
        </div>

        {/* Feature cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-24">
          {[
            {
              icon: "🤖",
              title: "AI-Generated Scenarios",
              description: "Claude creates unique, realistic incident scenarios tailored to your security tools, difficulty level, and chosen MITRE ATT&CK techniques."
            },
            {
              icon: "⚡",
              title: "Real-Time Multiplayer",
              description: "Run group exercises with live scoring, competitive leaderboards, and synchronized stage progression. Individual mode available too."
            },
            {
              icon: "🛡️",
              title: "Your Stack, Your Scenarios",
              description: "Select your security tools — CrowdStrike, Tenable, Sentinel, Zscaler — and scenarios reference real alerts from your actual tooling."
            },
          ].map((feature, i) => (
            <div key={i} className="cyber-card group animate-fade-in" style={{ animationDelay: `${i * 150}ms` }}>
              <div className="text-3xl mb-4">{feature.icon}</div>
              <h3 className="font-display text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-white text-center mb-16">
          Exercise in <span className="text-cyber-400">four steps</span>
        </h2>
        <div className="grid md:grid-cols-4 gap-8">
          {[
            { step: "01", title: "Configure", desc: "Select your security stack, choose a theme, set difficulty, pick MITRE techniques." },
            { step: "02", title: "Generate", desc: "AI creates a multi-stage incident narrative with tool-specific alerts and decision points." },
            { step: "03", title: "Execute", desc: "Run the TTX solo or as a team in real-time. Answer questions as the incident unfolds." },
            { step: "04", title: "Debrief", desc: "Review scores, export reports, and identify gaps in your incident response playbook." },
          ].map((item, i) => (
            <div key={i} className="relative">
              <div className="text-5xl font-display font-bold text-surface-3 mb-4">{item.step}</div>
              <h3 className="font-display text-lg font-semibold text-white mb-2">{item.title}</h3>
              <p className="text-gray-500 text-sm">{item.desc}</p>
              {i < 3 && (
                <div className="hidden md:block absolute top-8 -right-4 text-surface-4">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-white text-center mb-4">
          Simple, transparent pricing
        </h2>
        <p className="text-gray-400 text-center mb-16 max-w-xl mx-auto">
          Start free. Scale when you&apos;re ready. Every plan includes AI-generated scenarios.
        </p>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { name: "Free", price: "£0", period: "/forever", users: "5 users", ttx: "3 TTX/month", features: ["Individual mode", "Basic themes", "Leaderboard"], cta: "Get Started", highlight: false },
            { name: "Starter", price: "£49", period: "/month", users: "15 users", ttx: "15 TTX/month", features: ["Group mode", "All themes", "PDF export", "Leaderboard"], cta: "Start Trial", highlight: false },
            { name: "Professional", price: "£149", period: "/month", users: "50 users", ttx: "50 TTX/month", features: ["Everything in Starter", "Custom scenarios", "Priority support", "Analytics"], cta: "Start Trial", highlight: true },
            { name: "Enterprise", price: "Custom", period: "", users: "500+ users", ttx: "Unlimited", features: ["Everything in Pro", "SSO/SAML", "API access", "Dedicated CSM", "On-prem option"], cta: "Contact Sales", highlight: false },
          ].map((plan, i) => (
            <div key={i} className={`cyber-card relative ${plan.highlight ? "border-cyber-600 shadow-lg shadow-cyber-900/20 ring-1 ring-cyber-600/20" : ""}`}>
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-cyber-600 rounded-full text-xs font-semibold text-white">
                  Most Popular
                </div>
              )}
              <h3 className="font-display text-lg font-semibold text-white">{plan.name}</h3>
              <div className="mt-4 mb-6">
                <span className="text-3xl font-display font-bold text-white">{plan.price}</span>
                <span className="text-gray-500 text-sm">{plan.period}</span>
              </div>
              <div className="space-y-1 text-sm text-gray-400 mb-6">
                <p>{plan.users}</p>
                <p>{plan.ttx}</p>
              </div>
              <ul className="space-y-2 mb-8">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2 text-sm text-gray-300">
                    <svg className="w-4 h-4 text-cyber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    {f}
                  </li>
                ))}
              </ul>
              <button className={plan.highlight ? "cyber-btn-primary w-full" : "cyber-btn-secondary w-full"}>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-surface-3/50 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-cyber-600 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <span className="font-display text-sm font-semibold text-gray-400">CyberTTX</span>
          </div>
          <p className="text-gray-600 text-sm">© {new Date().getFullYear()} CyberTTX. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
