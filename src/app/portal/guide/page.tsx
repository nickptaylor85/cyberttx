export default function GuidePage() {
  const s = [
    { t: "Getting Started", i: "🚀", steps: ["Set up your company profile with industry, size, and compliance frameworks", "Add your security tools (CrowdStrike, Defender, Tenable, etc.)", "Create characters for realistic scenario narratives", "Launch your first exercise — AI generates in ~30 seconds"] },
    { t: "Running Exercises", i: "🎯", steps: ["Individual mode: solo at your own pace", "Group mode: real-time team competition with live scoring", "Executive mode: board-level strategic decisions, not technical SOC questions"] },
    { t: "After Completion", i: "📊", steps: ["Review score breakdown with explanations", "Download branded after-action PDF report", "Generate IR playbooks (NIST, SANS, ISO 27035, MITRE, CREST)", "Rate the exercise to calibrate future AI difficulty"] },
    { t: "Tracking Progress", i: "📈", steps: ["MITRE ATT&CK coverage — see tested vs untested techniques", "Compliance evidence — auto-mapped to ISO 27001, NIST CSF, SOC 2, NIS2, DORA", "Team performance — individual accuracy trends over time", "Leaderboard — competitive ranking across your team"] },
  ];
  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl sm:text-2xl font-bold text-white">User Guide</h1></div>
      <div className="space-y-6">{s.map((sec, i) => (
        <div key={i} className="cyber-card"><div className="flex items-center gap-3 mb-4"><span className="text-2xl">{sec.i}</span><h2 className="font-display text-base font-semibold text-white">{sec.t}</h2></div>
        <div className="space-y-2">{sec.steps.map((st, j) => <div key={j} className="flex gap-3"><div className="w-5 h-5 rounded-full bg-cyber-600/20 flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-cyber-400 text-xs font-bold">{j+1}</span></div><p className="text-gray-400 text-sm">{st}</p></div>)}</div></div>
      ))}</div>
      <div className="cyber-card mt-6 text-center"><p className="text-gray-500 text-sm">Need help? <a href="mailto:support@threatcast.io" className="text-cyber-400">support@threatcast.io</a></p></div>
    </div>
  );
}
