"use client";
import { useState, useEffect } from "react";

export default function NotificationsPage() {
  const [prefs, setPrefs] = useState({
    streakReminder: true, weeklyChallenge: true, dailyDigest: true,
    teamActivity: true, exerciseComplete: true,
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const s = localStorage.getItem("tc_notif_prefs");
    if (s) try { setPrefs(JSON.parse(s)); } catch {}
  }, []);

  function toggle(key: string) {
    const next = { ...prefs, [key]: !(prefs as any)[key] };
    setPrefs(next);
    localStorage.setItem("tc_notif_prefs", JSON.stringify(next));
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  }

  const items = [
    { key: "streakReminder", label: "Streak Expiry Reminders", desc: "Get notified when your streak is about to expire" },
    { key: "weeklyChallenge", label: "Weekly Challenge", desc: "Notification when the new weekly challenge drops" },
    { key: "dailyDigest", label: "Daily Digest Email", desc: "Quick question in your inbox every weekday morning" },
    { key: "teamActivity", label: "Team Activity", desc: "When teammates complete exercises or beat your score" },
    { key: "exerciseComplete", label: "Exercise Reports", desc: "Summary email when you complete an exercise" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="font-display text-xl sm:text-2xl font-bold text-white">Notifications</h1><p className="text-gray-500 text-xs mt-1">Control what emails and alerts you receive</p></div>
        {saved && <span className="text-green-400 text-xs">✓ Saved</span>}
      </div>
      <div className="cyber-card space-y-4">{items.map(item => (
        <div key={item.key} className="flex items-center justify-between py-2 border-b border-surface-3/30 last:border-0">
          <div><p className="text-white text-sm">{item.label}</p><p className="text-gray-500 text-xs">{item.desc}</p></div>
          <button onClick={() => toggle(item.key)}
            className={`w-10 h-5 rounded-full transition-colors relative ${(prefs as any)[item.key] ? "bg-green-500" : "bg-surface-4"}`}>
            <span className="absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all" style={{ left: (prefs as any)[item.key] ? "22px" : "2px" }} />
          </button>
        </div>
      ))}</div>
      <p className="text-gray-600 text-xs mt-3">Email notifications are sent to your registered email address. Changes apply immediately.</p>
    </div>
  );
}
