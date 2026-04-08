export function LogoMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <filter id="tcn"><feGaussianBlur stdDeviation="2" result="b1"/><feGaussianBlur stdDeviation="5" result="b2"/><feMerge><feMergeNode in="b2"/><feMergeNode in="b1"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <linearGradient id="tcsg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style={{stopColor:"#00ffd5"}}/><stop offset="100%" style={{stopColor:"#14b89a"}}/></linearGradient>
      </defs>
      <rect width="120" height="120" rx="24" fill="#030712"/>
      <path d="M0 40h120M0 80h120M40 0v120M80 0v120" stroke="rgba(0,255,213,0.03)" strokeWidth="0.5"/>
      <ellipse cx="60" cy="60" rx="38" ry="38" fill="rgba(0,255,213,0.04)"/>
      <path d="M60 14 L30 29 L26 74 L60 104 L94 74 L90 29 Z" fill="rgba(0,255,213,0.04)" stroke="url(#tcsg)" strokeWidth="2" filter="url(#tcn)"/>
      <circle cx="60" cy="56" r="16" fill="none" stroke="rgba(0,255,213,0.25)" strokeWidth="0.7"/>
      <circle cx="60" cy="56" r="8" fill="none" stroke="rgba(0,255,213,0.4)" strokeWidth="0.7"/>
      <line x1="60" y1="40" x2="60" y2="46" stroke="#00ffd5" strokeWidth="0.8" opacity="0.5"/>
      <line x1="60" y1="66" x2="60" y2="72" stroke="#00ffd5" strokeWidth="0.8" opacity="0.5"/>
      <line x1="44" y1="56" x2="50" y2="56" stroke="#00ffd5" strokeWidth="0.8" opacity="0.5"/>
      <line x1="70" y1="56" x2="76" y2="56" stroke="#00ffd5" strokeWidth="0.8" opacity="0.5"/>
      <path d="M51 56 L57 63 L70 48" fill="none" stroke="#00ffd5" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter" filter="url(#tcn)"/>
      <path d="M94 42 L104 36 L112 40" fill="none" stroke="#00ffd5" strokeWidth="1.3" opacity="0.5" strokeLinecap="square"/>
      <path d="M95 54 L108 50 L116 56" fill="none" stroke="#00ffd5" strokeWidth="0.9" opacity="0.25" strokeLinecap="square"/>
      <circle cx="104" cy="36" r="1.2" fill="#00ffd5" opacity="0.6"/>
      <path d="M8 8 L8 22 M8 8 L22 8" stroke="rgba(0,255,213,0.12)" strokeWidth="0.8" fill="none"/>
      <path d="M112 8 L112 22 M112 8 L98 8" stroke="rgba(0,255,213,0.12)" strokeWidth="0.8" fill="none"/>
      <path d="M8 112 L8 98 M8 112 L22 112" stroke="rgba(0,255,213,0.12)" strokeWidth="0.8" fill="none"/>
      <path d="M112 112 L112 98 M112 112 L98 112" stroke="rgba(0,255,213,0.12)" strokeWidth="0.8" fill="none"/>
    </svg>
  );
}

export function LogoWordmark({ className = "", size = "base" }: { className?: string; size?: "sm" | "base" | "lg" }) {
  const textSize = size === "sm" ? "text-sm" : size === "lg" ? "text-lg" : "text-base";
  return (
    <span className={`font-mono font-extrabold tracking-wider ${textSize} ${className}`}>
      <span className="text-gray-100">THREAT</span>
      <span className="text-[#00ffd5]">CAST</span>
    </span>
  );
}

export function LogoFull({ size = 32, className = "" }: { size?: number; className?: string }) {
  const wordSize = size >= 36 ? "lg" : size >= 28 ? "base" : "sm";
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      <LogoWordmark size={wordSize} />
    </div>
  );
}
