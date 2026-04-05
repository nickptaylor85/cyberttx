export function SkeletonCard() {
  return <div className="cyber-card animate-pulse"><div className="h-4 bg-surface-3 rounded w-3/4 mb-3" /><div className="h-3 bg-surface-3 rounded w-1/2" /></div>;
}
export function SkeletonGrid({ count = 4 }: { count?: number }) {
  return <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{Array.from({ length: count }).map((_, i) => <div key={i} className="cyber-card animate-pulse"><div className="h-8 bg-surface-3 rounded w-1/2 mx-auto mb-2" /><div className="h-3 bg-surface-3 rounded w-2/3 mx-auto" /></div>)}</div>;
}
export function SkeletonList({ count = 5 }: { count?: number }) {
  return <div className="space-y-2">{Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}</div>;
}
