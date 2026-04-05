export function LogoMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M20 3L5 10v10c0 9.55 6.4 18.48 15 20.5 8.6-2.02 15-10.95 15-20.5V10L20 3z" fill="url(#shield-grad)" stroke="#14b89a" strokeWidth="1.5" strokeLinejoin="round"/>
      <circle cx="20" cy="18" r="4" fill="#14b89a" opacity="0.9"/>
      <path d="M14.5 12.5a8 8 0 0 1 11 0" stroke="#2dd4b3" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.7"/>
      <path d="M11.5 9.5a13 13 0 0 1 17 0" stroke="#2dd4b3" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.4"/>
      <path d="M20 22v6M17 25l3 3 3-3" stroke="#14b89a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
      <defs><linearGradient id="shield-grad" x1="20" y1="3" x2="20" y2="40" gradientUnits="userSpaceOnUse"><stop stopColor="#0d947d" stopOpacity="0.3"/><stop offset="1" stopColor="#0d947d" stopOpacity="0.05"/></linearGradient></defs>
    </svg>
  );
}
export function LogoFull({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (<div className={`flex items-center gap-2.5 ${className}`}><LogoMark size={size} /><span className="font-display font-bold text-white" style={{ fontSize: size * 0.5 }}>Threat<span className="text-cyber-400">Cast</span></span></div>);
}
