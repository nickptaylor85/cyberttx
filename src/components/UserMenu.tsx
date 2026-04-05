"use client";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export default function UserMenu() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  if (!session?.user) {
    return <a href="/sign-in" className="text-gray-400 hover:text-white text-sm">Sign In</a>;
  }

  const initials = (session.user.name || session.user.email || "U").slice(0, 2).toUpperCase();

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="w-8 h-8 rounded-full bg-cyber-600/30 border border-cyber-600/40 flex items-center justify-center text-cyber-400 text-xs font-bold hover:bg-cyber-600/40 transition-colors">
        {initials}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-50 w-48 bg-surface-1 border border-surface-3 rounded-lg shadow-xl overflow-hidden">
            <div className="p-3 border-b border-surface-3">
              <p className="text-white text-sm font-medium truncate">{session.user.name}</p>
              <p className="text-gray-500 text-xs truncate">{session.user.email}</p>
            </div>
            <button onClick={() => signOut({ callbackUrl: "/" })} className="w-full text-left px-3 py-2.5 text-red-400 text-sm hover:bg-red-500/10 transition-colors">Sign Out</button>
          </div>
        </>
      )}
    </div>
  );
}
