"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/portal", label: "Dashboard", icon: "📊", exact: true },
  { href: "/portal/ttx", label: "Exercises", icon: "🎯" },
  { href: "/portal/leaderboard", label: "Leaderboard", icon: "🏆" },
  { href: "/portal/tools", label: "Security Stack", icon: "🛡️" },
  { href: "/portal/characters", label: "Characters", icon: "🎭" },
  { href: "/portal/profile", label: "Company Profile", icon: "🏢" },
  { href: "/portal/users", label: "Team", icon: "👥" },
];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-surface-1 border-r border-surface-3 flex flex-col transition-transform duration-300 lg:translate-x-0",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-5 border-b border-surface-3 flex items-center justify-between">
          <Link href="/portal" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
            <div className="w-8 h-8 rounded-lg bg-cyber-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <span className="font-display text-base font-bold text-white">CyberTTX</span>
          </Link>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden p-1 text-gray-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                  isActive
                    ? "bg-cyber-600/15 text-cyber-400 border border-cyber-600/20"
                    : "text-gray-400 hover:bg-surface-2 hover:text-gray-200"
                )}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-surface-3">
          <div className="flex items-center gap-3">
            <UserButton afterSignOutUrl="/" />
            <div className="text-sm">
              <p className="text-gray-300 font-medium">Portal</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto min-w-0">
        {/* Mobile header */}
        <div className="lg:hidden sticky top-0 z-30 bg-surface-1/95 backdrop-blur-sm border-b border-surface-3 px-4 py-3 flex items-center justify-between">
          <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded-lg hover:bg-surface-2 text-gray-400">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <span className="font-display text-sm font-bold text-white">CyberTTX</span>
          <UserButton afterSignOutUrl="/" />
        </div>
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
