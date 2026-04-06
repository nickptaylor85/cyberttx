"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import UserMenu from "@/components/UserMenu";
import { cn } from "@/lib/utils";

const navSections = [
  { type: "item" as const, href: "/admin", label: "Dashboard", icon: "📊" },
  { type: "divider" as const, label: "Manage" },
  { type: "item" as const, href: "/admin/clients", label: "Client Portals", icon: "🏢" },
  { type: "item" as const, href: "/admin/sessions", label: "Sessions", icon: "🎯" },
  { type: "item" as const, href: "/admin/users", label: "All Users", icon: "👥" },
  { type: "divider" as const, label: "Intelligence" },
  { type: "item" as const, href: "/admin/analytics", label: "Analytics", icon: "📈" },
  { type: "item" as const, href: "/admin/activity", label: "Activity Feed", icon: "🔔" },
  { type: "item" as const, href: "/admin/threat-intel", label: "Threat Intel", icon: "🔍" },
  { type: "item" as const, href: "/admin/reviews", label: "Review Queue", icon: "⚖️" },
  { type: "divider" as const, label: "Business" },
  { type: "item" as const, href: "/admin/billing", label: "Billing & Revenue", icon: "💰" },
  { type: "item" as const, href: "/admin/emails", label: "Email Log", icon: "📧" },
  { type: "item" as const, href: "/admin/announcements", label: "Announcements", icon: "📢" },
  { type: "divider" as const, label: "System" },
  { type: "item" as const, href: "/admin/api-keys", label: "API Keys", icon: "🔑" },
  { type: "item" as const, href: "/admin/health", label: "System Health", icon: "💚" },
  { type: "item" as const, href: "/admin/audit", label: "Audit Log", icon: "📋" },
  { type: "item" as const, href: "/admin/support", label: "Support", icon: "🎫" },
  { type: "item" as const, href: "/admin/export", label: "Export", icon: "📥" },
  { type: "item" as const, href: "/admin/settings", label: "Settings", icon: "⚙️" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authState, setAuthState] = useState<"loading" | "ok" | "denied">("loading");

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Auth check — redirect if not SUPER_ADMIN
  useEffect(() => {
    fetch("/api/portal/me")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) {
          // Not authenticated — send to sign-in
          setAuthState("denied");
          router.push("/sign-in");
        } else if (d.role !== "SUPER_ADMIN") {
          // Authenticated but not admin — send to portal (not back to sign-in)
          setAuthState("denied");
          router.push("/portal");
        } else {
          setAuthState("ok");
        }
      })
      .catch(() => {
        setAuthState("denied");
        router.push("/sign-in");
      });
  }, [router]);

  if (authState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="relative flex h-4 w-4 mx-auto mb-3"><span className="animate-ping absolute h-full w-full rounded-full bg-cyber-400 opacity-75"></span><span className="relative rounded-full h-4 w-4 bg-cyber-500"></span></div>
          <p className="text-gray-500 text-sm">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (authState === "denied") return null;

  return (
    <div className="min-h-screen flex">
      {/* Mobile toggle */}
      <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-surface-1 border border-surface-3">
        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
      </button>

      {/* Sidebar */}
      <aside className={cn("w-60 bg-surface-1 border-r border-surface-3 p-4 flex flex-col fixed inset-y-0 left-0 z-40 transition-transform lg:translate-x-0", mobileOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex items-center justify-between mb-6">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center"><span className="text-white text-xs font-bold">TC</span></div>
            <div><span className="text-white text-sm font-bold">ThreatCast</span><span className="text-red-400 text-xs ml-1">Admin</span></div>
          </Link>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto">
          {navSections.map((item, i) => {
            if (item.type === "divider") {
              return <p key={i} className="text-xs font-semibold text-gray-600 uppercase tracking-wider mt-4 mb-1.5 px-3">{item.label}</p>;
            }
            const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={cn("flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors", active ? "bg-red-600/10 text-red-400 border border-red-600/20" : "text-gray-400 hover:text-gray-200 hover:bg-surface-2")}>
                <span className="text-base">{item.icon}</span>{item.label}
              </Link>
            );
          })}
        </nav>

        <div className="pt-3 mt-3 border-t border-surface-3">
          <div className="flex items-center justify-between">
            <Link href="/portal" className="text-gray-500 text-xs hover:text-gray-300">View Portal →</Link>
            <UserMenu />
          </div>
          <a href="/api/auth/signout" className="text-red-400/60 hover:text-red-400 text-xs mt-2 block">Sign Out</a>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Main */}
      <main className="flex-1 lg:ml-60 p-6 lg:p-8">{children}</main>
    </div>
  );
}
