"use client";
import { useState, useEffect } from "react";

export default function NotificationsPage() {
  const [emailOnComplete, setEmailOnComplete] = useState(true);
  const [emailOnInvite, setEmailOnInvite] = useState(true);

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl sm:text-2xl font-bold text-white">Notification Preferences</h1></div>
      <div className="cyber-card space-y-4">
        <div className="flex items-center justify-between">
          <div><p className="text-white text-sm">Exercise Completion</p><p className="text-gray-500 text-xs">Email when your exercise scenario is ready</p></div>
          <button onClick={() => setEmailOnComplete(!emailOnComplete)} className={`w-10 h-5 rounded-full transition-colors relative ${emailOnComplete ? "bg-green-500" : "bg-surface-4"}`}><span className="absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all" style={{ left: emailOnComplete ? "22px" : "2px" }} /></button>
        </div>
        <div className="flex items-center justify-between">
          <div><p className="text-white text-sm">Team Invitations</p><p className="text-gray-500 text-xs">Email when invited to a team exercise</p></div>
          <button onClick={() => setEmailOnInvite(!emailOnInvite)} className={`w-10 h-5 rounded-full transition-colors relative ${emailOnInvite ? "bg-green-500" : "bg-surface-4"}`}><span className="absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all" style={{ left: emailOnInvite ? "22px" : "2px" }} /></button>
        </div>
      </div>
    </div>
  );
}
