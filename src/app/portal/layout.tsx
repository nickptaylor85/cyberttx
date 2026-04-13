"use client";
import { signOut } from "next-auth/react";

import { LanguageProvider, useLanguage } from "@/lib/i18n/LanguageContext";
import SupportWidget from "@/components/SupportWidget";
import XpWidget from "@/components/XpWidget";
import { t as translate, LangCode } from "@/lib/i18n/translations";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark, LogoWordmark } from "@/components/Logo";
import UserMenu from "@/components/UserMenu";
import { cn } from "@/lib/utils";

interface NavItem { href: string; label: string; icon: string; exact?: boolean; adminOnly?: boolean; }
interface NavSection { label: string; icon: string; items: NavItem[]; defaultOpen?: boolean; adminOnly?: boolean; }

const allNavSections: (NavItem | NavSection)[] = [
  { href: "/portal", label: "Dashboard", icon: "📊", exact: true },

  // ─── ALL USERS ─────────────────────────────
  { label: "Train", icon: "🎯", defaultOpen: true, items: [
    { href: "/portal/ttx/new", label: "New Exercise", icon: "🎯" },
    { href: "/portal/daily-drill", label: "Daily Drill", icon: "⚡" },
    { href: "/portal/duels", label: "Duels", icon: "⚔️" },
    { href: "/portal/challenge", label: "Weekly Challenge", icon: "🏅" },
    { href: "/portal/ttx", label: "Exercise History", icon: "📋" },
  ]},

  { label: "My Progress", icon: "📊", defaultOpen: true, items: [
    { href: "/portal/leaderboard", label: "Leaderboard", icon: "🏆" },
    { href: "/portal/achievements", label: "Achievements", icon: "🏅" },
    { href: "/portal/my-performance", label: "My Performance", icon: "📈" },
    { href: "/portal/certificates", label: "Certificates", icon: "🎓" },
    { href: "/portal/playbooks", label: "Playbooks", icon: "📖" },
  ]},

  { label: "Intelligence", icon: "🛡️", items: [
    { href: "/portal/alerts", label: "Live Alert Feed", icon: "🚨" },
    { href: "/portal/coverage", label: "MITRE Coverage", icon: "🛡️" },
    { href: "/portal/benchmarks", label: "Benchmarks", icon: "📊" },
  ]},

  // ─── PORTAL ADMINS ONLY ────────────────────
  { label: "Team", icon: "👥", adminOnly: true, items: [
    { href: "/portal/team-compliance", label: "Compliance Tracker", icon: "✅" },
    { href: "/portal/performance", label: "Team Performance", icon: "📈" },
    { href: "/portal/users", label: "Members", icon: "👥" },
    { href: "/portal/schedule", label: "Schedule", icon: "📅" },
  ]},

  { label: "Organisation", icon: "🏢", adminOnly: true, items: [
    { href: "/portal/integrations", label: "Integrations", icon: "🔌" },
    { href: "/portal/tools", label: "Security Stack", icon: "🔧" },
    { href: "/portal/characters", label: "Characters", icon: "🎭" },
    { href: "/portal/compliance", label: "Compliance Evidence", icon: "📋" },
    { href: "/portal/profile", label: "Company Profile", icon: "🏢" },
    { href: "/portal/branding", label: "Custom Branding", icon: "🎨" },
    { href: "/portal/export", label: "Export Data", icon: "📥" },
  ]},

  // ─── ALL USERS ─────────────────────────────
  { label: "Settings", icon: "⚙️", items: [
    { href: "/portal/notifications", label: "Notifications", icon: "🔔" },
    { href: "/portal/settings", label: "Account", icon: "⚙️" },
    { href: "/portal/guide", label: "User Guide", icon: "📚" },
  ]},
];

function isSection(item: NavItem | NavSection): item is NavSection {
  return "items" in item;
}

function SectionGroup({ section, pathname, onNavigate }: { section: NavSection; pathname: string; onNavigate: () => void }) {
  const hasActiveChild = section.items.some(
    i => i.exact ? pathname === i.href : pathname === i.href || pathname.startsWith(i.href + "/")
  );
  const [open, setOpen] = useState(section.defaultOpen || hasActiveChild);

  // Auto-open if a child becomes active
  useEffect(() => { if (hasActiveChild) setOpen(true); }, [hasActiveChild]);

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors",
          hasActiveChild ? "text-cyber-400" : "text-gray-500 hover:text-gray-300"
        )}
      >
        <span className="flex items-center gap-2">
          <span className="text-sm">{section.icon}</span>
          {section.label}
        </span>
        <svg className={cn("w-3.5 h-3.5 transition-transform", open ? "rotate-90" : "")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
      {open && (
        <div className="ml-2 mt-0.5 space-y-0.5 border-l border-surface-3/50 pl-2">
          {section.items.map(item => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all",
                  isActive
                    ? "bg-cyber-600/15 text-cyber-400 border border-cyber-600/20"
                    : "text-gray-400 hover:bg-surface-2 hover:text-gray-200"
                )}
              >
                <span className="text-sm">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [branding, setBranding] = useState<{ portalName?: string; logoUrl?: string; primaryColor?: string }>({});
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [userRole, setUserRole] = useState<string>("MEMBER");

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Check if user needs onboarding
  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("tc_onboarded") && !window.location.pathname.includes("onboarding")) {
      fetch("/api/portal/me").then(r => r.ok ? r.json() : null).then((d: any) => {
        if (d && d.orgId) {
          // Check if org has a profile set up
          fetch("/api/portal/profile").then(r => r.ok ? r.json() : null).then((p: any) => {
            if (!p?.industry) window.location.href = "/portal/onboarding";
            else localStorage.setItem("tc_onboarded", "true");
          }).catch(() => {});
        }
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    fetch("/api/portal/branding").then(r => r.ok ? r.json() : {}).then(setBranding).catch(() => {});
    try { const d = JSON.parse(localStorage.getItem("tc_dismissed_announcements") || "[]"); setDismissedIds(new Set(d)); } catch {}
    fetch("/api/admin/announcements").then(r => r.ok ? r.json() : []).then(setAnnouncements).catch(() => {});
    fetch("/api/portal/me").then(r => r.ok ? r.json() : {}).then((d: any) => { if (d.role) setUserRole(d.role); }).catch(() => {});
  }, []);

  // Fetch user role for RBAC
  useEffect(() => {
    fetch("/api/portal/me").then(r => r.ok ? r.json() : null).then(d => {
      if (d?.role) setUserRole(d.role);
    }).catch(() => {});
  }, []);

  // Filter nav based on role
  const isAdmin = userRole === "CLIENT_ADMIN" || userRole === "SUPER_ADMIN";
  const navSections = allNavSections.map(item => {
    if ("items" in item) {
      if (item.adminOnly && !isAdmin) return null;
      const filteredItems = item.items.filter(i => !i.adminOnly || isAdmin);
      if (filteredItems.length === 0) return null;
      return { ...item, items: filteredItems };
    }
    if ((item as any).adminOnly && !isAdmin) return null;
    return item;
  }).filter(Boolean) as (NavItem | NavSection)[];

  return (
    <LanguageProvider>
    <div className="min-h-screen flex" style={branding.primaryColor ? { "--brand-color": branding.primaryColor } as React.CSSProperties : {}}>
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
            <span className="font-display text-base font-bold text-white">Threat<span className="text-cyber-400">Cast</span></span>
          </Link>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden p-1 text-gray-400 hover:text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navSections.map((item, i) => {
            if (isSection(item)) {
              return <SectionGroup key={item.label} section={item} pathname={pathname} onNavigate={() => setMobileOpen(false)} />;
            }
            // Standalone item (Dashboard)
            const isActive = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all mb-2",
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
            <UserMenu />
          <button onClick={() => window.location.href = "/api/auth/signout"} className="text-red-400/60 hover:text-red-400 text-xs mt-1">Sign Out</button>
            <div className="text-sm">
              <p className="text-gray-300 font-medium">Portal</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto min-w-0">
        <div className="lg:hidden sticky top-0 z-30 bg-surface-1/95 backdrop-blur-sm border-b border-surface-3 px-4 py-3 flex items-center justify-between">
          <button onClick={() => setMobileOpen(true)} className="p-1.5 rounded-lg hover:bg-surface-2 text-gray-400">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <LogoWordmark size="sm" />
          <UserMenu />
          <a href="/api/auth/signout" className="text-red-400/60 hover:text-red-400 text-xs mt-1">Sign Out</a>
        </div>
        <div className="p-4 sm:p-6 lg:p-8">
          <XpWidget />
          {announcements.filter((a: any) => !dismissedIds.has(a.id)).length > 0 && (
            <div className="mb-4 space-y-2">
              {announcements.filter((a: any) => !dismissedIds.has(a.id)).map((a: any) => (
                <div key={a.id} className={`p-3 rounded-lg border text-sm flex items-start justify-between ${a.type === "warning" ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-300" : a.type === "maintenance" ? "bg-purple-500/10 border-purple-500/20 text-purple-300" : "bg-blue-500/10 border-blue-500/20 text-blue-300"}`}>
                  <div><p className="font-semibold text-xs">{a.title}</p><p className="text-xs opacity-80 mt-0.5">{a.message}</p></div>
                  <button onClick={() => { const next = new Set(dismissedIds); next.add(a.id); setDismissedIds(next); localStorage.setItem("tc_dismissed_announcements", JSON.stringify([...next])); }} className="text-xs opacity-50 hover:opacity-100 ml-2 flex-shrink-0">✕</button>
                </div>
              ))}
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
    <SupportWidget /></LanguageProvider>
  );
}
