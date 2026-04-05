import { db } from "@/lib/db";
import { headers } from "next/headers";
import { getAuthUser } from "@/lib/auth-helpers";
import InviteForm from "./InviteForm";
import RoleManager from "./RoleManager";
export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const h = await headers(); const slug = h.get("x-org-slug") || "demo";
  const org = await db.organization.findUnique({ where: { slug } });
  if (!org) return <p className="text-red-400">Org not found</p>;

  const currentUser = await getAuthUser();
  const isAdmin = currentUser?.role === "CLIENT_ADMIN" || currentUser?.role === "SUPER_ADMIN";

  const users = await db.user.findMany({
    where: { orgId: org.id, clerkId: { not: { startsWith: "pending_" } } },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { participations: true } } },
  });

  const pendingInvites = await db.user.findMany({
    where: { orgId: org.id, clerkId: { startsWith: "pending_" } },
    select: { id: true, email: true, createdAt: true },
  });

  const rc: Record<string, string> = {
    SUPER_ADMIN: "bg-red-500/20 text-red-400",
    CLIENT_ADMIN: "bg-purple-500/20 text-purple-400",
    MEMBER: "bg-surface-3 text-gray-400",
  };
  const rl: Record<string, string> = {
    SUPER_ADMIN: "Platform Admin",
    CLIENT_ADMIN: "Portal Admin",
    MEMBER: "Participant",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-white">Team</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">{users.length} members{pendingInvites.length > 0 ? ` · ${pendingInvites.length} pending` : ""}</p>
        </div>
      </div>

      {isAdmin && <InviteForm />}

      {/* RBAC legend */}
      <div className="cyber-card mb-4">
        <p className="text-gray-500 text-xs mb-2 font-semibold">Roles</p>
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1.5"><span className={`cyber-badge ${rc.CLIENT_ADMIN}`}>Portal Admin</span><span className="text-gray-600">— invite users, manage settings, view all data</span></div>
          <div className="flex items-center gap-1.5"><span className={`cyber-badge ${rc.MEMBER}`}>Participant</span><span className="text-gray-600">— run exercises, view own performance</span></div>
        </div>
      </div>

      {/* Pending invitations */}
      {pendingInvites.length > 0 && (
        <div className="cyber-card mb-4 border-yellow-500/20">
          <h3 className="text-yellow-400 text-xs font-semibold mb-2">Pending Invitations</h3>
          <div className="space-y-1.5">{pendingInvites.map(p => (
            <div key={p.id} className="flex items-center justify-between py-1">
              <span className="text-gray-400 text-xs">{p.email}</span>
              <span className="text-gray-600 text-xs">Invited {new Date(p.createdAt).toLocaleDateString("en-GB")}</span>
            </div>
          ))}</div>
        </div>
      )}

      {/* Active members */}
      <div className="space-y-2">{users.map(u => (
        <div key={u.id} className="cyber-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-cyber-600/20 flex items-center justify-center text-cyber-400 text-sm font-bold">
                {(u.firstName?.[0] || u.email[0]).toUpperCase()}
              </div>
              <div>
                <p className="text-white text-sm">{u.firstName} {u.lastName}</p>
                <p className="text-gray-500 text-xs">{u.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600 text-xs">{u._count.participations} exercises</span>
              <span className={`cyber-badge text-xs ${rc[u.role]}`}>{rl[u.role]}</span>
              {isAdmin && u.id !== currentUser?.id && u.role !== "SUPER_ADMIN" && (
                <RoleManager userId={u.id} currentRole={u.role} userName={`${u.firstName || ''} ${u.lastName || ''}`} />
              )}
            </div>
          </div>
        </div>
      ))}</div>
    </div>
  );
}
