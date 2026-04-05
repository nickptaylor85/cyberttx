import { db } from "@/lib/db";
export const dynamic = "force-dynamic";

export default async function EmailsPage() {
  // Track invitations by looking at users who joined recently
  const recentUsers = await db.user.findMany({
    take: 30, orderBy: { createdAt: "desc" },
    select: { firstName: true, lastName: true, email: true, createdAt: true, role: true, organization: { select: { name: true } } },
  });

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl sm:text-2xl font-bold text-white">Email & Invitation Log</h1><p className="text-gray-500 text-xs sm:text-sm mt-1">Track invitations and signups</p></div>
      <div className="cyber-card mb-4">
        <p className="text-gray-400 text-xs mb-3">Email delivery tracking requires Resend webhook integration. Below shows user signups as a proxy for invitation acceptance.</p>
      </div>
      <div className="cyber-card">
        <h2 className="text-white text-sm font-semibold mb-3">Recent Signups</h2>
        <div className="space-y-2">{recentUsers.map((u, i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-surface-3/50 last:border-0">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-green-500/10 flex items-center justify-center text-green-400 text-xs">✉</div>
              <div><p className="text-white text-xs">{u.firstName} {u.lastName}</p><p className="text-gray-500 text-xs">{u.email}</p></div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-xs">{u.organization?.name || "No org"}</span>
              <span className="text-gray-600 text-xs">{new Date(u.createdAt).toLocaleDateString("en-GB")}</span>
            </div>
          </div>
        ))}</div>
      </div>
    </div>
  );
}
