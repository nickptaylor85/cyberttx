import { db } from "@/lib/db";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

async function getOrg() {
  const headersList = await headers();
  const slug = headersList.get("x-org-slug") || "demo";
  return db.organization.findUnique({ where: { slug } });
}

export default async function UsersPage() {
  const org = await getOrg();
  if (!org) return <p className="text-red-400">Organization not found</p>;

  const users = await db.user.findMany({
    where: { orgId: org.id, isActive: true },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { participations: true } },
    },
  });

  // Get total scores per user
  const participantScores = await db.ttxParticipant.groupBy({
    by: ["userId"],
    where: { session: { orgId: org.id, status: "COMPLETED" } },
    _sum: { totalScore: true },
    _count: true,
  });

  const scoreMap = new Map(participantScores.map((p) => [p.userId, { total: p._sum.totalScore || 0, count: p._count }]));

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Team</h1>
          <p className="text-gray-500 text-sm mt-1">
            {users.length} of {org.maxUsers} members
          </p>
        </div>
        <div className="cyber-card py-3 px-4">
          <p className="text-gray-500 text-xs">Invite link</p>
          <p className="text-cyber-400 text-sm font-mono">
            {org.slug}.threatcast.io/sign-up
          </p>
        </div>
      </div>

      {/* Capacity bar */}
      <div className="mb-6">
        <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${users.length >= org.maxUsers ? "bg-red-500" : "bg-cyber-500"}`}
            style={{ width: `${Math.min(100, (users.length / org.maxUsers) * 100)}%` }}
          />
        </div>
      </div>

      {/* User list */}
      <div className="overflow-hidden rounded-xl border border-surface-3">
        <table className="w-full">
          <thead>
            <tr className="bg-surface-2">
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Member</th>
              <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Role</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Exercises</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Total Score</th>
              <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const scores = scoreMap.get(user.id);
              return (
                <tr key={user.id} className="border-t border-surface-3 hover:bg-surface-2/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-surface-3 flex items-center justify-center text-sm font-semibold text-cyber-400">
                          {(user.firstName?.[0] || user.email[0]).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-white text-sm font-medium">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-gray-500 text-xs">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`cyber-badge ${
                      user.role === "CLIENT_ADMIN"
                        ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                        : "bg-surface-3 text-gray-400 border-surface-4"
                    }`}>
                      {user.role === "CLIENT_ADMIN" ? "Admin" : "Member"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right text-gray-300 text-sm">
                    {scores?.count || 0}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="font-mono text-cyber-400 text-sm">
                      {(scores?.total || 0).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right text-gray-500 text-sm">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
