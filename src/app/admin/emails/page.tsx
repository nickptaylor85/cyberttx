import { db } from "@/lib/db";
export const dynamic = "force-dynamic";

export default async function EmailsPage() {
  // All users — both active and pending
  const allUsers = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, firstName: true, lastName: true, email: true, createdAt: true, updatedAt: true, role: true, isActive: true, clerkId: true, organization: { select: { name: true } } },
  });

  const pendingInvites = allUsers.filter(u => u.clerkId.startsWith("pending_"));
  const registeredUsers = allUsers.filter(u => u.clerkId.startsWith("hash:"));
  const clerkMigrated = allUsers.filter(u => !u.clerkId.startsWith("hash:") && !u.clerkId.startsWith("pending_"));

  // Group by date
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const week = new Date(today.getTime() - 7 * 86400000);
  const month = new Date(today.getTime() - 30 * 86400000);

  const signupsToday = registeredUsers.filter(u => new Date(u.createdAt) >= today).length;
  const signupsWeek = registeredUsers.filter(u => new Date(u.createdAt) >= week).length;
  const signupsMonth = registeredUsers.filter(u => new Date(u.createdAt) >= month).length;

  // Build event log
  const events: { type: string; email: string; name: string; org: string; date: Date; icon: string; color: string }[] = [];

  registeredUsers.forEach(u => {
    events.push({
      type: "Signup", email: u.email,
      name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email,
      org: u.organization?.name || "Unlinked",
      date: new Date(u.createdAt), icon: "✅", color: "border-l-green-500",
    });
  });

  pendingInvites.forEach(u => {
    events.push({
      type: "Invitation Sent", email: u.email, name: "Pending",
      org: u.organization?.name || "Unknown",
      date: new Date(u.createdAt), icon: "📧", color: "border-l-yellow-500",
    });
  });

  clerkMigrated.forEach(u => {
    events.push({
      type: "Legacy (Clerk)", email: u.email,
      name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email,
      org: u.organization?.name || "Unlinked",
      date: new Date(u.createdAt), icon: "🔄", color: "border-l-blue-500",
    });
  });

  events.sort((a, b) => b.date.getTime() - a.date.getTime());

  // Invitation conversion rate
  const totalInvited = pendingInvites.length + registeredUsers.length;
  const conversionRate = totalInvited > 0 ? Math.round((registeredUsers.length / totalInvited) * 100) : 0;

  // Org distribution
  const orgCounts: Record<string, { invites: number; signups: number }> = {};
  pendingInvites.forEach(u => {
    const org = u.organization?.name || "Unlinked";
    if (!orgCounts[org]) orgCounts[org] = { invites: 0, signups: 0 };
    orgCounts[org].invites++;
  });
  registeredUsers.forEach(u => {
    const org = u.organization?.name || "Unlinked";
    if (!orgCounts[org]) orgCounts[org] = { invites: 0, signups: 0 };
    orgCounts[org].signups++;
  });

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl sm:text-2xl font-bold text-white">Email & Invitation Log</h1><p className="text-gray-500 text-xs mt-1">Track invitations, signups, and conversions</p></div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-green-400">{registeredUsers.length}</p><p className="text-gray-500 text-xs">Registered</p></div>
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-yellow-400">{pendingInvites.length}</p><p className="text-gray-500 text-xs">Pending</p></div>
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-cyan-400">{conversionRate}%</p><p className="text-gray-500 text-xs">Conversion</p></div>
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-white">{signupsToday}</p><p className="text-gray-500 text-xs">Today</p></div>
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-blue-400">{signupsWeek}</p><p className="text-gray-500 text-xs">This Week</p></div>
        <div className="cyber-card text-center"><p className="font-display text-2xl font-bold text-purple-400">{signupsMonth}</p><p className="text-gray-500 text-xs">This Month</p></div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        {/* Per-portal breakdown */}
        <div className="cyber-card">
          <h2 className="text-white text-sm font-semibold mb-3">Invitations by Portal</h2>
          {Object.keys(orgCounts).length === 0 ? <p className="text-gray-500 text-xs">No data</p> :
            <div className="space-y-2">{Object.entries(orgCounts).sort((a, b) => (b[1].invites + b[1].signups) - (a[1].invites + a[1].signups)).map(([org, counts]) => (
              <div key={org} className="flex items-center justify-between py-1.5 border-b border-surface-3/50 last:border-0">
                <span className="text-white text-sm">{org}</span>
                <div className="flex gap-3 text-xs">
                  <span className="text-yellow-400">{counts.invites} pending</span>
                  <span className="text-green-400">{counts.signups} joined</span>
                  <span className="text-gray-500">{counts.invites + counts.signups > 0 ? Math.round((counts.signups / (counts.invites + counts.signups)) * 100) : 0}%</span>
                </div>
              </div>
            ))}</div>
          }
        </div>

        {/* Email types legend */}
        <div className="cyber-card">
          <h2 className="text-white text-sm font-semibold mb-3">Email Types Sent</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 py-2 border-b border-surface-3/50"><span className="text-lg">📧</span><div><p className="text-white text-sm">Invitation Email</p><p className="text-gray-500 text-xs">Sent when admin invites a user to a portal</p></div></div>
            <div className="flex items-center gap-3 py-2 border-b border-surface-3/50"><span className="text-lg">👋</span><div><p className="text-white text-sm">Welcome Email</p><p className="text-gray-500 text-xs">Sent on signup with onboarding steps</p></div></div>
            <div className="flex items-center gap-3 py-2 border-b border-surface-3/50"><span className="text-lg">🔑</span><div><p className="text-white text-sm">Password Reset</p><p className="text-gray-500 text-xs">Sent when user requests password reset</p></div></div>
            <div className="flex items-center gap-3 py-2 border-b border-surface-3/50"><span className="text-lg">🎯</span><div><p className="text-white text-sm">Exercise Ready</p><p className="text-gray-500 text-xs">Sent when scenario generation completes</p></div></div>
            <div className="flex items-center gap-3 py-2"><span className="text-lg">📊</span><div><p className="text-white text-sm">Exercise Completed</p><p className="text-gray-500 text-xs">Sent to portal admins with results</p></div></div>
          </div>
        </div>
      </div>

      {/* Full event log */}
      <div className="cyber-card">
        <h2 className="text-white text-sm font-semibold mb-3">Activity Log ({events.length} events)</h2>
        <div className="space-y-1">{events.slice(0, 50).map((e, i) => (
          <div key={i} className={`flex items-center justify-between py-1.5 border-b border-surface-3/30 last:border-0 border-l-2 pl-3 ${e.color}`}>
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm flex-shrink-0">{e.icon}</span>
              <span className="text-gray-400 text-xs font-semibold flex-shrink-0 w-28">{e.type}</span>
              <span className="text-white text-xs truncate">{e.email}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-purple-400 text-xs">{e.org}</span>
              <span className="text-gray-600 text-xs">{e.date.toLocaleDateString("en-GB")} {e.date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          </div>
        ))}</div>
      </div>
    </div>
  );
}
