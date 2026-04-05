"use client";
import { useState, useEffect } from "react";

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!document.cookie.includes("cookie_consent=")) setShow(true);
  }, []);

  function accept() {
    document.cookie = "cookie_consent=accepted; path=/; max-age=31536000; SameSite=Lax";
    setShow(false);
  }
  function decline() {
    document.cookie = "cookie_consent=declined; path=/; max-age=31536000; SameSite=Lax";
    setShow(false);
  }

  if (!show) return null;
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface-1 border-t border-surface-3 px-4 py-3 sm:px-6">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-gray-400 text-xs sm:text-sm">We use essential cookies for authentication and analytics. See our <a href="/privacy" className="text-cyber-400 hover:text-cyber-300">Privacy Policy</a>.</p>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={decline} className="cyber-btn-secondary text-xs py-1.5 px-4">Decline</button>
          <button onClick={accept} className="cyber-btn-primary text-xs py-1.5 px-4">Accept</button>
        </div>
      </div>
    </div>
  );
}
