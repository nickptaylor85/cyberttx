"use client";
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-4xl mb-4">⚠️</p>
        <h1 className="font-display text-xl font-bold text-white mb-2">Something went wrong</h1>
        <p className="text-gray-500 text-sm mb-6">{error.message || "An unexpected error occurred."}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="cyber-btn-secondary text-sm">Try Again</button>
          <a href="/portal" className="cyber-btn-primary text-sm">Dashboard</a>
        </div>
      </div>
    </div>
  );
}
