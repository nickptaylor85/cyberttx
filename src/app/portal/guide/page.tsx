export default function GuidePage() {
  const sections = [
    { title: "Getting Started", icon: "🚀", items: [
      { q: "How do I get started?", a: "After signing up, you'll go through a 4-step onboarding: choose your industry, company size, and security tools. This personalises your AI-generated exercises." },
      { q: "What's my first step?", a: "Try the Daily Drill (⚡ in the sidebar) — it's 3 questions in 2 minutes. Then try the Weekly Challenge (🏅) to see the leaderboard. When ready, create a full exercise from All Exercises → New Exercise." },
      { q: "How does the XP system work?", a: "Every completed exercise earns XP: (50 base + accuracy bonus) × difficulty multiplier. Beginner ×1, Intermediate ×1.5, Advanced ×2, Expert ×3. You level up from Recruit (0 XP) through 10 levels to Elite Defender (10,000 XP). Your level and streak appear at the top of every page." },
      { q: "What are streaks?", a: "Complete at least one exercise per day to build a streak. The 🔥 indicator shows consecutive days. Miss a day and it resets. You'll get an email warning before your streak expires." },
    ]},
    { title: "Daily Drill & Weekly Challenge", icon: "⚡", items: [
      { q: "What is the Daily Drill?", a: "3 rapid-fire cybersecurity questions with a 2-minute timer. The AI analyses your past performance and targets your weakest areas. If you're struggling with insider threats, tomorrow's drill focuses on that. Shows a 'Targeting your weak spot' badge when adaptive." },
      { q: "What is the Weekly Challenge?", a: "A themed exercise that changes every Monday. Everyone across the platform competes on the same challenge. Top 3 get medals (🥇🥈🥉). Your best score is saved — you can retry to improve." },
      { q: "How is the weekly challenge chosen?", a: "Themes rotate: ransomware → phishing → APT → insider threat → supply chain → cloud breach → data exfil → DDoS. New challenge every Monday." },
    ]},
    { title: "Duels", icon: "⚔️", items: [
      { q: "What are duels?", a: "Head-to-head battles against a teammate. 5 rapid-fire questions, 75-second timer, same questions for both players. Winner gets bragging rights and bonus XP." },
      { q: "How do I create a duel?", a: "Go to Train → Duels → pick a theme → Create Duel. An email is sent to every teammate in your portal. The first person to accept is your opponent." },
      { q: "What happens when I accept a duel?", a: "You become the opponent and the duel goes ACTIVE. Both players answer the same 5 questions independently. When both finish, scores are compared and a winner is declared." },
      { q: "Can I duel someone specific?", a: "Currently duels are open — anyone on your team can accept. The email notification creates urgency so the fastest teammate gets the match." },
      { q: "What do I win?", a: "Victory shows 🏆 on the results page. You also earn XP from the questions you answer correctly, with a difficulty multiplier." },
    ]},
    { title: "Live Alert Feed & SIEM Integration", icon: "🚨", items: [
      { q: "Which tools are supported?", a: "CrowdStrike Falcon, Secureworks Taegis XDR, Microsoft Defender XDR, Microsoft Sentinel, Splunk, Elastic Security, Tenable.io, and Palo Alto Cortex XDR." },
      { q: "How do I connect a tool?", a: "Go to Integrations → select your platform → enter API credentials → Save. The alert feed will start pulling critical and high severity alerts within seconds." },
      { q: "What does 'Build TTX' do?", a: "Click Build TTX on any alert to generate a full tabletop exercise based on that real alert. The AI uses the alert's severity, MITRE techniques, and affected assets to create a realistic scenario." },
      { q: "Are my SIEM credentials safe?", a: "Credentials are stored encrypted. The GET endpoint only returns the first 4 characters masked (e.g. 'abc1••••'). We only access alert metadata — never raw event data." },
    ]},
    { title: "Exercises", icon: "🎯", items: [
      { q: "What types of exercises are there?", a: "Individual (solo practice), Group Real-Time (multiplayer with live scoring and lobby), and Custom Exercise (you set the theme, difficulty, and incident description)." },
      { q: "How many questions per exercise?", a: "Default is 10. Each question has 3 options with one correct answer. After answering, you get a detailed explanation and must wait 3 seconds before continuing." },
      { q: "Can I retry exercises?", a: "Yes. Click 'Attempt →' on any completed exercise to clone it and try again. Your new results are tracked separately." },
      { q: "What themes are available?", a: "Ransomware, phishing, insider threat, supply chain, cloud breach, APT, DDoS, data exfiltration — plus custom incidents you describe." },
      { q: "What are 'This Really Happened' cards?", a: "After every question explanation, the AI includes a real-world incident reference — like 'This technique was used in the MGM Resorts breach (2023) when Scattered Spider called the helpdesk.' This anchors abstract concepts to memorable real stories. The platform has 22 real incidents in its database covering Colonial Pipeline, SolarWinds, MOVEit, Okta, and more." },
      { q: "How does multiplayer work?", a: "Choose 'Group (Real-time)' when creating. A lobby is created with a shareable link. Team members join → host clicks Start → everyone answers simultaneously. Live indicators show who's answered. Scoreboard at the end." },
    ]},
    { title: "Characters", icon: "🎭", items: [
      { q: "What are characters?", a: "Named recurring personas (like 'Sarah Chen, CISO' or 'Marcus Webb, SOC Lead') that the AI weaves into your scenarios with realistic dialogue and decision-making." },
      { q: "How do I create one?", a: "Go to Characters → fill in name, role, department, personality, communication style → Create. They'll appear in future exercises automatically." },
      { q: "Can I edit characters?", a: "Yes — click the ✏️ button on any character card to update their details." },
    ]},
    { title: "Playbooks & Certificates", icon: "📋", items: [
      { q: "What is a playbook?", a: "After completing an exercise, click 📋 Playbook to generate an incident response playbook. It contains detection, containment, eradication, and recovery stages with specific actions from the exercise." },
      { q: "Can I export playbooks?", a: "Yes — PDF and Word (.docx) export from the playbook viewer or your Playbook Library. They're auto-saved when viewed." },
      { q: "How do certificates work?", a: "Click 🎓 Certificate after completing an exercise. A branded PDF certificate is generated with your name, score, grade (Platinum/Gold/Silver/Bronze), and MITRE techniques. Certificates have a 1-year expiry." },
    ]},
    { title: "Performance & Compliance", icon: "📊", items: [
      { q: "What does My Performance show?", a: "Monthly accuracy trends (bar chart), total exercises, improvement suggestions based on your weak areas, and where to practice next." },
      { q: "What about Team Performance?", a: "Aggregated monthly trends for your entire team with accuracy bars." },
      { q: "What's the MITRE Coverage heatmap?", a: "A visual map of all MITRE ATT&CK techniques you've practised. Hover for details. Green = well covered, yellow = some coverage, grey = gaps. Use it to target specific techniques." },
      { q: "Which compliance frameworks are supported?", a: "ISO 27001, NIST CSF, SOC 2, NIS2, DORA, PCI DSS 4.0. Each shows evidence items from your exercises, playbooks, and certificates." },
      { q: "What is Team Compliance?", a: "A traffic-light dashboard showing each team member's training status: green (on track), amber (at risk), red (overdue). Helps managers identify who needs a nudge." },
      { q: "How do Benchmarks work?", a: "Your organisation's accuracy and exercise volume compared anonymously against the platform average and organisations of similar size." },
    ]},
    { title: "Campaigns & Scheduling", icon: "📆", items: [
      { q: "What are campaigns?", a: "A 12-month training calendar aligned with real security events. January: Security Reset, April: Phishing Season, October: Cybersecurity Awareness Month, etc. One-click launch for each exercise." },
      { q: "Can I schedule exercises?", a: "Yes — the Schedule page lets you set recurring exercises. Vercel cron jobs auto-generate them every Monday." },
    ]},
    { title: "Integrations", icon: "🔌", items: [
      { q: "What integrations exist?", a: "8 SIEM/XDR connectors, Slack bot (/threatcast commands), Microsoft Teams webhook, email notifications, and Resend for transactional emails." },
      { q: "How does the Slack bot work?", a: "Add /threatcast as a slash command: help, run [theme], status, leaderboard, themes." },
      { q: "How does Microsoft Teams work?", a: "Configure a Teams incoming webhook URL in Settings. ThreatCast sends exercise notifications as adaptive cards with an 'Open ThreatCast' button." },
    ]},
    { title: "Account & Security", icon: "🔒", items: [
      { q: "How do I reset my password?", a: "Click 'Forgot password?' on the sign-in page. You'll receive an email with a reset link valid for 1 hour." },
      { q: "Is MFA available?", a: "Yes — TOTP-based MFA via authenticator app. Enable it in Settings → Security." },
      { q: "What about SSO?", a: "SAML SSO configuration is available on Enterprise plans. Configure in Settings → SSO." },
      { q: "How is my data protected?", a: "TLS 1.3 in transit, encrypted at rest, bcrypt password hashing (12 rounds), security headers (CSP, HSTS, X-Frame-Options). Hosted on SOC 2-certified infrastructure (Vercel + Neon)." },
      { q: "Can I customise my portal?", a: "Enterprise plans can set a custom portal name, logo, and brand colour. Go to Configure → Custom Branding." },
    ]},
    { title: "Threat Actors", icon: "🕵️", items: [
      { q: "What are threat actors in ThreatCast?", a: "A database of 27+ real-world threat groups (APT29, Lazarus, Scattered Spider, LockBit, etc.) with their TTPs, targets, and notable attacks. You can select one when creating an exercise to model the attack after that group's patterns." },
      { q: "How do I use them?", a: "When creating a new exercise, Step 2 shows all available threat actors. Select one to make the AI generate a scenario based on that group's known techniques. Or skip to let the AI choose." },
      { q: "Can I add new threat actors?", a: "Admins can add actors via Admin → Threat Actors. There are 10 curated actors available to add with one click, or use 'Discover New Actors' to find more via AI search." },
    ]},
    { title: "AI Provider (BYOK)", icon: "🤖", items: [
      { q: "What is BYOK?", a: "Bring Your Own Key — use your own API key from Anthropic, OpenAI, or Google to power exercise generation instead of the ThreatCast default. Available on Professional and Enterprise plans." },
      { q: "Which providers are supported?", a: "Anthropic Claude (Sonnet 4, Haiku 4.5), OpenAI (GPT-4o, GPT-4o Mini, o3 Mini), and Google Gemini (2.5 Flash, 2.5 Pro). OpenAI's JSON mode eliminates generation errors." },
      { q: "How do I set it up?", a: "Go to Organisation → AI Provider → select your provider → paste your API key → choose a model → enable the toggle. The key is validated before saving and encrypted at rest." },
      { q: "Can I switch back?", a: "Yes — disable the toggle or click 'Remove Key' to revert to the ThreatCast default at any time." },
    ]},
    { title: "Privacy & Data", icon: "🔐", items: [
      { q: "How do I download my data?", a: "Go to Settings → 'Download My Data'. This generates a JSON export of all your personal data, exercise history, playbooks, certificates, and duels — as required by GDPR Article 15." },
      { q: "How do I delete my account?", a: "Settings → 'Delete My Account'. Requires email confirmation. Deletes all your data including participations, answers, playbooks, certificates, and duels. A hashed record is kept for 30 days for compliance." },
      { q: "Can an admin delete the whole organisation?", a: "Yes — Settings → 'Delete Organisation' (admin only). Requires typing the org name to confirm. Deletes all users, exercises, and data permanently." },
    ]},
  ];

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl sm:text-2xl font-bold text-white">User Guide</h1><p className="text-gray-500 text-xs mt-1">{sections.length} sections · {sections.reduce((a, s) => a + s.items.length, 0)} questions answered</p></div>
      <div className="space-y-4">{sections.map(s => (
        <div key={s.title} className="cyber-card">
          <h2 className="text-white text-sm font-semibold flex items-center gap-2 mb-3"><span>{s.icon}</span>{s.title}</h2>
          <div className="space-y-0">{s.items.map((item, i) => (
            <details key={i} className="border-b border-surface-3/30 last:border-0">
              <summary className="py-2.5 text-gray-300 text-xs cursor-pointer hover:text-white">{item.q}</summary>
              <p className="pb-3 text-gray-500 text-xs leading-relaxed pl-2 border-l-2 border-cyber-600/30 ml-1">{item.a}</p>
            </details>
          ))}</div>
        </div>
      ))}</div>
    </div>
  );
}
