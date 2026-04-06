import { db } from "@/lib/db";
import AdminUserActions from "./AdminUserActions";
export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { organization: { select: { id: true, name: true, plan: true } }, _count: { select: { participations: true } } },
  });
  const orgs = await db.organization.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
  const pending = users.filter(u => u.clerkId.startsWith("pending_"));
  const active = users.filter(u => !u.clerkId.startsWith("pending_"));

  const rc: Record<string, string> = { SUPER_ADMIN: "bg-red-500/20 text-red-400", CLIENT_ADMIN: "bg-purple-500/20 text-purple-400", MEMBER: "bg-surface-3 text-gray-400" };
  const rl: Record<string, string> = { SUPER_ADMIN: "Platform Admin", CLIENT_ADMIN: "Portal Admin", MEMBER: "Participant" };

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-xl sm:text-2xl font-bold text-white">All Users</h1>
        <p className="text-gray-500 text-xs sm:text-sm mt-1">{active.length} active · {pending.length} pending invitations</p>
      </div>

      {/* Active users */}
      <div className="space-y-2">
        {active.map(u => (
          <div key={u.id} className="cyber-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${u.isActive ? "bg-cyber-600/20 text-cyber-400" : "bg-red-500/20 text-red-400"}`}>
                  {(u.firstName?.[0] || u.email[0]).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-white text-sm truncate">
                    {u.firstName} {u.lastName}
                    {!u.isActive && <span className="text-red-400 text-xs ml-2">(disabled)</span>}
                  </p>
                  <p className="text-gray-500 text-xs truncate">{u.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {u.organization && <span className="text-gray-500 text-xs hidden sm:inline">{u.organization.name}</span>}
                <span className={`cyber-badge text-xs ${rc[u.role]}`}>{rl[u.role]}</span>
                <span className="text-gray-600 text-xs">{u._count.participations} ex</span>
                <AdminUserActions
                  userId={u.id}
                  userName={`${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email}
                  userEmail={u.email}
                  currentRole={u.role}
                  currentOrgId={u.organization?.id || null}
                  isActive={u.isActive}
                  orgs={orgs}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pending invitations */}
      {pending.length > 0 && (
        <div className="mt-6">
          <h2 className="text-yellow-400 text-sm font-semibold mb-3">Pending Invitations ({pending.length})</h2>
          <div className="space-y-2">
            {pending.map(u => (
              <div key={u.id} className="cyber-card border-yellow-500/20 flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">{u.email}</p>
                  <p className="text-gray-600 text-xs">{u.organization?.name || "No org"} · Invited {new Date(u.createdAt).toLocaleDateString("en-GB")}</p>
                </div>
                <AdminUserActions
                  userId={u.id}
                  userName={u.email}
                  userEmail={u.email}
                  currentRole={u.role}
                  currentOrgId={u.organization?.id || null}
                  isActive={true}
                  orgs={orgs}
                  isPending
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
