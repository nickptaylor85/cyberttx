"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
export default function DeleteExerciseButton({ sessionId }: { sessionId: string }) {
  const router = useRouter(); const [deleting, setDeleting] = useState(false);
  async function del() { if (!confirm("Delete this exercise?")) return; setDeleting(true); await fetch(`/api/ttx/session/${sessionId}`, { method: "DELETE" }); router.refresh(); }
  return <button onClick={del} disabled={deleting} className="cyber-btn-danger text-xs py-1.5 px-3">{deleting ? "..." : "🗑️"}</button>;
}
