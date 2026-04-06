import { db } from "@/lib/db";
import { getPortalOrg, getAuthUser } from "@/lib/auth-helpers";
export const dynamic = "force-dynamic";

export default async function TeamCompliancePage() {
  const org = await getPortalOrg();
  if (!org) return <p className="text-red-400 p-8">Not found</p>;

  const users = await db.user.findMany({
    where: { orgId: org.id, clerkId: { startsWith: "hash:" } },
    select: { id: true, firstName: true, lastName: true, email: true },
  });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);

  const userStats = await Promise.all(users.map(async (u) => {
    const thisMonth = await db.ttxParticipant.count({
      where: { userId: u.id, session: { orgId: org.id, status: "COMPLETED", completedAt: { gte: startOfMonth } } },
    });
    const last = await db.ttxParticipant.findFirst({
      where: { userId: u.id, session: { orgId: org.id, status: "COMPLETED" } },
      orderBy: { session: { completedAt: "desc" } },
      include: { session: { select: { completedAt: true } } },
    });
    const lastDate = last?.session?.completedAt;
    const daysSinceLast = lastDate ? Math.floor((now.getTime() - lastDate.getTime()) / 86400000) : 999;

    let status: "green" | "amber" | "red" = "green";
    if (thisMonth === 0 && daysSinceLast > 14) status = "red";
    else if (thisMonth === 0 || daysSinceLast > 7) status = "amber";

    return {
      name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email,
      email: u.email, thisMonth, daysSinceLast, status, lastDate,
    };
  }));

  userStats.sort((a, b) => (a.status === "red" ? 0 : a.status === "amber" ? 1 : 2) - (b.status === "red" ? 0 : b.status === "amber" ? 1 : 2));

  const green = userStats.filter(u => u.status === "green").length;
  const amber = userStats.filter(u => u.status === "amber").length;
  const red = userStats.filter(u => u.status === "red").length;
  const sc = { green: "bg-green-500/20 text-green-400 border-green-500/30", amber: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", red: "bg-red-500/20 text-red-400 border-red-500/30" };

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl sm:text-2xl font-bold text-white">Team Compliance</h1><p className="text-gray-500 text-xs mt-1">Training status for {userStats.length} team members this month</p></div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="cyber-card text-center border-green-500/20"><p className="font-display text-2xl font-bold text-green-400">{green}</p><p className="text-gray-500 text-xs">On Track</p></div>
        <div className="cyber-card text-center border-yellow-500/20"><p className="font-display text-2xl font-bold text-yellow-400">{amber}</p><p className="text-gray-500 text-xs">At Risk</p></div>
        <div className="cyber-card text-center border-red-500/20"><p className="font-display text-2xl font-bold text-red-400">{red}</p><p className="text-gray-500 text-xs">Overdue</p></div>
      </div>

      <div className="cyber-card">
        <table className="w-full text-xs">
          <thead><tr className="border-b border-surface-3"><th className="text-left py-2 text-gray-500 font-normal">Name</th><th className="text-left py-2 text-gray-500 font-normal">This Month</th><th className="text-left py-2 text-gray-500 font-normal">Last Active</th><th className="text-left py-2 text-gray-500 font-normal">Status</th></tr></thead>
          <tbody>{userStats.map((u, i) => (
            <tr key={i} className="border-b border-surface-3/30 last:border-0">
              <td className="py-2"><p className="text-white">{u.name}</p><p className="text-gray-600">{u.email}</p></td>
              <td className="py-2 text-gray-400">{u.thisMonth} exercises</td>
              <td className="py-2 text-gray-400">{u.daysSinceLast < 999 ? `${u.daysSinceLast}d ago` : "Never"}</td>
              <td className="py-2"><span className={`cyber-badge text-xs border ${sc[u.status]}`}>{u.status === "green" ? "✓ On Track" : u.status === "amber" ? "⚠ At Risk" : "✕ Overdue"}</span></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
