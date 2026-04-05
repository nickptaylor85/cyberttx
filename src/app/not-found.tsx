import Link from "next/link";
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="font-display text-6xl font-bold text-cyber-400 mb-4">404</p>
        <h1 className="font-display text-xl font-bold text-white mb-2">Page not found</h1>
        <p className="text-gray-500 text-sm mb-6">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/" className="cyber-btn-secondary text-sm">Home</Link>
          <Link href="/portal" className="cyber-btn-primary text-sm">Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
