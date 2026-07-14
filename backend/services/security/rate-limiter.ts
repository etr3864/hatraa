import { RATE_LIMIT_PER_DAY } from "@/lib/constants";

interface RateEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateEntry>();
const WINDOW_MS = 24 * 60 * 60 * 1000;

function pruneExpired(now: number) {
  if (store.size < 500) return;
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(ip: string, limit = RATE_LIMIT_PER_DAY): RateLimitResult {
  const now = Date.now();
  pruneExpired(now);

  const key = ip || "unknown";
  let entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + WINDOW_MS };
    store.set(key, entry);
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  store.set(key, entry);

  return {
    allowed: true,
    remaining: Math.max(0, limit - entry.count),
    resetAt: entry.resetAt,
  };
}

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return headers.get("x-real-ip") || "unknown";
}
