// Simple in-memory rate limiter (resets on cold start, which is fine for serverless)
const attempts = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, maxAttempts: number, windowMs: number): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = attempts.get(key);
  
  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1 };
  }
  
  entry.count++;
  if (entry.count > maxAttempts) {
    return { allowed: false, remaining: 0 };
  }
  
  return { allowed: true, remaining: maxAttempts - entry.count };
}
// Mon Apr  6 18:46:32 UTC 2026
