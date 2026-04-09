"use client";
import confetti from "canvas-confetti";

export function fireCelebration(type: "complete" | "levelup" | "streak" | "correct" | "duel-win" = "complete") {
  switch (type) {
    case "complete":
      // Cyberpunk-themed burst
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors: ["#00ffd5", "#14b89a", "#ffffff", "#0ea5e9"] });
      setTimeout(() => confetti({ particleCount: 40, spread: 100, origin: { y: 0.7 }, colors: ["#00ffd5", "#a78bfa"] }), 300);
      break;
    case "levelup":
      // Big celebration for level up
      const end = Date.now() + 1500;
      const interval = setInterval(() => {
        if (Date.now() > end) return clearInterval(interval);
        confetti({ particleCount: 30, angle: 60, spread: 55, origin: { x: 0 }, colors: ["#00ffd5", "#14b89a", "#ffffff"] });
        confetti({ particleCount: 30, angle: 120, spread: 55, origin: { x: 1 }, colors: ["#00ffd5", "#14b89a", "#ffffff"] });
      }, 200);
      break;
    case "streak":
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.5 }, colors: ["#f59e0b", "#ff6b35", "#00ffd5"] });
      break;
    case "correct":
      // Small burst for correct trivia answer
      confetti({ particleCount: 15, spread: 40, origin: { y: 0.7 }, gravity: 1.2, colors: ["#00ffd5", "#14b89a"], scalar: 0.8 });
      break;
    case "duel-win":
      // Victory rain
      const dur = Date.now() + 2000;
      const iv = setInterval(() => {
        if (Date.now() > dur) return clearInterval(iv);
        confetti({ particleCount: 20, angle: 90, spread: 120, startVelocity: 30, origin: { x: Math.random(), y: -0.1 }, colors: ["#00ffd5", "#ffd700", "#ffffff"] });
      }, 150);
      break;
  }
}
