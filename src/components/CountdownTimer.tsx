"use client";
import { useState, useEffect, useCallback } from "react";

interface CountdownTimerProps {
  seconds: number;
  onExpired: () => void;
  paused?: boolean;
  size?: "sm" | "md";
}

export default function CountdownTimer({ seconds, onExpired, paused, size = "md" }: CountdownTimerProps) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (paused || remaining <= 0) return;
    const interval = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [paused, remaining <= 0, onExpired]);

  const pct = (remaining / seconds) * 100;
  const isUrgent = remaining <= 10;
  const isCritical = remaining <= 5;

  const radius = size === "sm" ? 16 : 22;
  const stroke = size === "sm" ? 3 : 4;
  const circumference = 2 * Math.PI * radius;
  const dashoffset = circumference * (1 - pct / 100);
  const svgSize = (radius + stroke) * 2;

  return (
    <div className="flex items-center gap-2">
      <svg width={svgSize} height={svgSize} className={isCritical ? "animate-pulse" : ""}>
        {/* Background circle */}
        <circle cx={radius + stroke} cy={radius + stroke} r={radius}
          fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
        {/* Progress circle */}
        <circle cx={radius + stroke} cy={radius + stroke} r={radius}
          fill="none"
          stroke={isCritical ? "#ef4444" : isUrgent ? "#f59e0b" : "#00ffd5"}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          transform={`rotate(-90 ${radius + stroke} ${radius + stroke})`}
          className="transition-all duration-1000 ease-linear"
        />
        {/* Time text */}
        <text x={radius + stroke} y={radius + stroke}
          textAnchor="middle" dominantBaseline="central"
          className={`font-mono font-bold ${size === "sm" ? "text-[10px]" : "text-xs"}`}
          fill={isCritical ? "#ef4444" : isUrgent ? "#f59e0b" : "#e5e7eb"}>
          {remaining}
        </text>
      </svg>
      {isUrgent && !paused && remaining > 0 && (
        <span className={`text-[10px] font-mono ${isCritical ? "text-red-400" : "text-amber-400"}`}>
          {isCritical ? "HURRY!" : "Time running out"}
        </span>
      )}
    </div>
  );
}
