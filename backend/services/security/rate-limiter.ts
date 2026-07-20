import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { RATE_LIMIT_PER_DAY } from "@/lib/constants";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

interface MemoryEntry {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, MemoryEntry>();
const WINDOW_MS = 24 * 60 * 60 * 1000;
const limiters = new Map<number, Ratelimit>();

let redis: Redis | null | undefined;

function getRedis(): Redis | null {
  if (redis !== undefined) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  redis = url && token ? new Redis({ url, token }) : null;
  return redis;
}

function getLimiter(limit: number): Ratelimit | null {
  const client = getRedis();
  if (!client) return null;

  const cached = limiters.get(limit);
  if (cached) return cached;

  const limiter = new Ratelimit({
    redis: client,
    limiter: Ratelimit.slidingWindow(limit, "1 d"),
    prefix: `hatraa:rl:${limit}`,
    analytics: false,
  });
  limiters.set(limit, limiter);
  return limiter;
}

function pruneMemory(now: number) {
  if (memoryStore.size < 500) return;
  for (const [key, entry] of memoryStore) {
    if (entry.resetAt <= now) memoryStore.delete(key);
  }
}

function checkMemory(ip: string, limit: number): RateLimitResult {
  const now = Date.now();
  pruneMemory(now);
  const key = ip || "unknown";
  let entry = memoryStore.get(key);

  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + WINDOW_MS };
    memoryStore.set(key, entry);
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  memoryStore.set(key, entry);
  return {
    allowed: true,
    remaining: Math.max(0, limit - entry.count),
    resetAt: entry.resetAt,
  };
}

export async function checkRateLimit(
  ip: string,
  limit = RATE_LIMIT_PER_DAY
): Promise<RateLimitResult> {
  const limiter = getLimiter(limit);
  if (!limiter) return checkMemory(ip, limit);

  try {
    const result = await limiter.limit(ip || "unknown");
    return {
      allowed: result.success,
      remaining: result.remaining,
      resetAt: result.reset,
    };
  } catch (error) {
    console.warn(
      "[rate-limit] Upstash unavailable, falling back to memory:",
      error instanceof Error ? error.message : error
    );
    return checkMemory(ip, limit);
  }
}

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return headers.get("x-real-ip") || "unknown";
}

export function isUpstashConfigured(): boolean {
  return getRedis() !== null;
}
