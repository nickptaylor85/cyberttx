import { db } from "@/lib/db";
import { headers } from "next/headers";
import InviteForm from "./InviteForm";
export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const h = await headers(); const slug = h.get("x-org-slug") || "demo";
  const org = await db.organization.findUnique({ where: { slug } });
  if (!org) return <p className="text-red-400">Org not found</p>;
  const users = await db.user.findMany({
    where: { orgId: org.id }, orderBy: { createdAt: "desc" },
    include: { _count: { select: { participations: true } } },
  });
  const rc: Record<string, string> = { SUPER_ADMIN: "bg-red-500/20 text-red-400", CLIENT_ADMIN: "bg-purple-500/20 text-purple-400", MEMBER: "bg-surface-3 text-gray-400" };
  return (
    <div>
      <div className="flex items-center justify-between mb-6"><div><h1 className="font-display text-xl sm:text-2xl font-bold text-white">Team</h1><p className="text-gray-500 text-xs sm:text-sm mt-1">{users.length} members</p></div></div>
      <InviteForm />
      <div className="space-y-2 mt-4">{users.map(u => (
        <div key={u.id} className="cyber-card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-cyber-600/20 flex items-center justify-center text-cyber-400 text-sm font-bold">{(u.firstName?.[0] || u.email[0]).toUpperCase()}</div>
            <div><p className="text-white text-sm">{u.firstName} {u.lastName}</p><p className="text-gray-500 text-xs">{u.email}</p></div>
          </div>
          <div className="flex items-center gap-2"><span className={`cyber-badge text-xs ${rc[u.role]}`}>{u.role}</span><span className="text-gray-600 text-xs">{u._count.participations} exercises</span></div>
        </div>
      ))}</div>
    </div>
  );
}
