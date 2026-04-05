"use client";
import { useEffect, useState } from "react";
export default function TrialBanner() {
  const [trial, setTrial] = useState<{ daysLeft: number } | null>(null);
  useEffect(() => { fetch("/api/portal/trial").then(r => r.ok ? r.json() : null).then(setTrial).catch(() => {}); }, []);
  if (!trial || trial.daysLeft > 7) return null;
  return (<div className={`px-4 py-2 text-center text-sm font-medium ${trial.daysLeft <= 0 ? "bg-red-600 text-white" : trial.daysLeft <= 3 ? "bg-orange-500/90 text-white" : "bg-yellow-500/90 text-black"}`}>{trial.daysLeft <= 0 ? "Your trial has expired. Upgrade to continue." : `${trial.daysLeft} day${trial.daysLeft !== 1 ? "s" : ""} left in your trial.`}</div>);
}
