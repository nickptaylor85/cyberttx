import { db } from "@/lib/db";
import { getPortalOrg } from "@/lib/auth-helpers";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getData() {
  const baseOrg = await getPortalOrg();
  if (!baseOrg) return null;
  const org = await db.organization.findUnique({
    where: { id: baseOrg.id },
    include: {
      _count: { select: { users: true, ttxSessions: true } },
      profile: { select: { industry: true } },
      securityTools: { select: { toolId: true } },
    },
  });
  if (!org) return null;

  const completedCount = await db.ttxSession.count({ where: { orgId: org.id, status: "COMPLETED" } });
  const recentSessions = await db.ttxSession.findMany({
    where: { orgId: org.id }, take: 5, orderBy: { createdAt: "desc" },
    select: { id: true, title: true, status: true, theme: true, difficulty: true, createdAt: true, completedAt: true, _count: { select: { participants: true } } },
  });
  const topPlayers = await db.ttxParticipant.findMany({
    where: { session: { orgId: org.id, status: "COMPLETED" } },
    orderBy: { totalScore: "desc" }, take: 5,
    select: { totalScore: true, user: { select: { firstName: true, lastName: true } } },
  });
  const characters = await db.ttxCharacter.count({ where: { orgId: org.id } });

  // Onboarding state
  const hasProfile = !!org.profile?.industry;
  const hasTools = org.securityTools.length > 0;
  const hasCharacters = characters > 0;
  const hasExercise = org._count.ttxSessions > 0;
  const onboardingComplete = hasProfile && hasTools && hasExercise;
  const onboardingSteps = [
    { label: "Company profile", done: hasProfile, href: "/portal/profile", icon: "🏢" },
    { label: "Security stack", done: hasTools, href: "/portal/tools", icon: "🛡️" },
    { label: "Add characters", done: hasCharacters, href: "/portal/characters", icon: "🎭" },
    { label: "Run first exercise", done: hasExercise, href: "/portal/ttx/new", icon: "🎯" },
  ];
  const stepsComplete = onboardingSteps.filter(s => s.done).length;

  return { org, completedCount, recentSessions, topPlayers, onboardingComplete, onboardingSteps, stepsComplete };
}

export default async function PortalDashboard() {
  const data = await getData();
  if (!data) return <p className="text-red-400 p-8">Organization not found</p>;
  const { org, completedCount, recentSessions, topPlayers, onboardingComplete, onboardingSteps, stepsComplete } = data;

  const quickLaunch = [
    { theme: "ransomware", label: "Ransomware", icon: "🔐", desc: "LockBit-style encryption campaign" },
    { theme: "supply-chain", label: "Supply Chain", icon: "🔗", desc: "JLR/SolarWinds-style attack" },
    { theme: "retail-attack", label: "UK Retail", icon: "🔥", desc: "M&S/Co-op coordinated campaign" },
    { theme: "insider-threat", label: "Insider Threat", icon: "👤", desc: "Malicious or negligent insider" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-xl sm:text-2xl font-bold text-white">Welcome to {org.name}</h1>
        <p className="text-gray-500 text-xs sm:text-sm mt-1">ThreatCast Dashboard</p>
      </div>

      {/* Onboarding wizard — show until complete */}
      {!onboardingComplete && (
        <div className="cyber-card border-cyber-600/30 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-base font-semibold text-white">Get Started</h2>
            <span className="text-cyber-400 text-sm font-mono">{stepsComplete}/4</span>
          </div>
          <div className="h-1.5 bg-surface-3 rounded-full mb-4 overflow-hidden">
            <div className="h-full bg-cyber-500 rounded-full transition-all" style={{ width: `${(stepsComplete / 4) * 100}%` }} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {onboardingSteps.map(step => (
              <Link key={step.label} href={step.href}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${step.done ? "bg-green-500/5 border-green-500/20" : "bg-surface-0 border-surface-3 hover:border-cyber-600/40"}`}>
                <span className="text-xl">{step.done ? "✅" : step.icon}</span>
                <div>
                  <p className={`text-sm font-medium ${step.done ? "text-green-400 line-through" : "text-white"}`}>{step.label}</p>
                  {!step.done && <p className="text-gray-500 text-xs">Required</p>}
                </div>
              </Link>
            ))}
          </div>
          {stepsComplete < 2 && (
            <p className="text-gray-500 text-xs mt-3 text-center">Complete your profile and tools to get personalised AI scenarios — it takes under 5 minutes.</p>
          )}
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-cyber-400">{org._count.ttxSessions}</p><p className="text-gray-500 text-xs mt-1">Total Exercises</p></div>
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-green-400">{completedCount}</p><p className="text-gray-500 text-xs mt-1">Completed</p></div>
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-white">{org._count.users}</p><p className="text-gray-500 text-xs mt-1">Team Members</p></div>
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-purple-400">{org.securityTools.length}</p><p className="text-gray-500 text-xs mt-1">Security Tools</p></div>
      </div>

      {/* Quick launch */}
      <div className="cyber-card mb-6">
        <h2 className="font-display text-base font-semibold text-white mb-4">Quick Launch</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {quickLaunch.map(q => (
            <Link key={q.theme} href={`/portal/ttx/new?theme=${q.theme}&difficulty=INTERMEDIATE`}
              className="p-3 rounded-lg bg-surface-0 border border-surface-3 hover:border-cyber-600/40 transition-colors text-center">
              <span className="text-xl">{q.icon}</span>
              <p className="text-white text-xs font-medium mt-1">{q.label}</p>
              <p className="text-gray-600 text-[10px] mt-0.5">{q.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent + Top */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="cyber-card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-base font-semibold text-white">Recent Exercises</h2>
            <Link href="/portal/ttx" className="text-cyber-400 text-xs hover:text-cyber-300">View all →</Link>
          </div>
          {recentSessions.length === 0 ? <p className="text-gray-500 text-sm">No exercises yet</p> :
            <div className="space-y-2">{recentSessions.map(s => (
              <Link key={s.id} href={`/portal/ttx/${s.id}`} className="flex items-center justify-between py-2 border-b border-surface-3/50 last:border-0 hover:bg-surface-0/50 -mx-1 px-1 rounded">
                <div className="min-w-0"><p className="text-white text-sm truncate">{s.title}</p><p className="text-gray-600 text-xs">{s.theme} · {s._count.participants} participants</p></div>
                <span className={`cyber-badge text-xs flex-shrink-0 ${s.status === "COMPLETED" ? "bg-green-500/20 text-green-400" : s.status === "IN_PROGRESS" ? "bg-blue-500/20 text-blue-400" : "bg-surface-3 text-gray-400"}`}>{s.status === "COMPLETED" ? "Done" : s.status === "IN_PROGRESS" ? "Live" : s.status}</span>
              </Link>
            ))}</div>
          }
        </div>

        <div className="cyber-card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-base font-semibold text-white">Top Performers</h2>
            <Link href="/portal/leaderboard" className="text-cyber-400 text-xs hover:text-cyber-300">Leaderboard →</Link>
          </div>
          {topPlayers.length === 0 ? <p className="text-gray-500 text-sm">Complete exercises to see rankings</p> :
            <div className="space-y-2">{topPlayers.map((p, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-surface-3/50 last:border-0">
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-yellow-500/20 text-yellow-400" : i === 1 ? "bg-gray-400/20 text-gray-300" : i === 2 ? "bg-orange-500/20 text-orange-400" : "bg-surface-2 text-gray-500"}`}>{i + 1}</span>
                  <p className="text-white text-sm">{p.user.firstName} {p.user.lastName}</p>
                </div>
                <span className="text-cyber-400 font-mono text-sm">{p.totalScore}</span>
              </div>
            ))}</div>
          }
        </div>
      </div>
    </div>
  );
}
