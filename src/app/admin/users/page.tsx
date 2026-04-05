import { db } from "@/lib/db";
export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const users = await db.user.findMany({ orderBy: { createdAt: "desc" }, include: { organization: { select: { name: true, plan: true } }, _count: { select: { participations: true } } } });
  const rc: Record<string, string> = { SUPER_ADMIN: "bg-red-500/20 text-red-400", CLIENT_ADMIN: "bg-purple-500/20 text-purple-400", MEMBER: "bg-surface-3 text-gray-400" };
  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl sm:text-2xl font-bold text-white">All Users</h1><p className="text-gray-500 text-xs sm:text-sm mt-1">{users.length} users across all portals</p></div>
      <div className="space-y-2">{users.map(u => (
        <div key={u.id} className="cyber-card flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-cyber-600/20 flex items-center justify-center text-cyber-400 text-sm font-bold">{(u.firstName?.[0] || u.email[0]).toUpperCase()}</div>
            <div><p className="text-white text-sm">{u.firstName} {u.lastName}</p><p className="text-gray-500 text-xs">{u.email}</p></div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {u.organization && <span className="text-gray-400 text-xs">{u.organization.name}</span>}
            <span className={`cyber-badge text-xs ${rc[u.role] || ""}`}>{u.role}</span>
            <span className="text-gray-600 text-xs">{u._count.participations} exercises</span>
          </div>
        </div>
      ))}</div>
    </div>
  );
}
