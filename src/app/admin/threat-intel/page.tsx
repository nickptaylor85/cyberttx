"use client";
import { useState, useEffect } from "react";
import ThreatIntelManager from "./ThreatIntelManager";

export default function ThreatIntelPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/threat-intel").then(r => r.ok ? r.json() : { events: [] }).then(d => {
      setEvents(d.events || d || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-6"><h1 className="font-display text-xl sm:text-2xl font-bold text-white">Threat Intelligence</h1><p className="text-gray-500 text-xs sm:text-sm mt-1">{events.length} events · Admin can remove globally</p></div>
      {loading ? <p className="text-gray-500 text-center py-8">Loading...</p> :
        <ThreatIntelManager events={events} isAdmin={true} />
      }
    </div>
  );
}
