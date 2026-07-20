import { Redis } from "@upstash/redis";
import { isUpstashConfigured } from "./rate-limiter";

const MAX_FAILURES = 5;
const LOCKOUT_MS = 15 * 60 * 1000;
const KEY_PREFIX = "hatraa:admin-login:";

interface MemoryLock {
  failures: number;
  lockedUntil: number;
}

const memoryLocks = new Map<string, MemoryLock>();

let redis: Redis | null | undefined;

function getRedis(): Redis | null {
  if (redis !== undefined) return redis;
  if (!isUpstashConfigured()) {
    redis = null;
    return null;
  }
  const url = process.env.UPSTASH_REDIS_REST_URL!.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!.trim();
  redis = new Redis({ url, token });
  return redis;
}

export type LoginGuardResult =
  | { allowed: true }
  | { allowed: false; retryAfterSec: number };

export async function assertAdminLoginAllowed(
  ip: string
): Promise<LoginGuardResult> {
  const client = getRedis();
  if (client) {
    try {
      const raw = await client.get<number | string>(`${KEY_PREFIX}${ip}`);
      const failures = Number(raw ?? 0);
      if (failures >= MAX_FAILURES) {
        const ttl = await client.ttl(`${KEY_PREFIX}${ip}`);
        return {
          allowed: false,
          retryAfterSec: ttl > 0 ? ttl : Math.ceil(LOCKOUT_MS / 1000),
        };
      }
      return { allowed: true };
    } catch {
      return assertMemoryAllowed(ip);
    }
  }
  return assertMemoryAllowed(ip);
}

export async function recordAdminLoginFailure(ip: string): Promise<void> {
  const client = getRedis();
  if (client) {
    try {
      const key = `${KEY_PREFIX}${ip}`;
      const failures = await client.incr(key);
      if (failures === 1) {
        await client.pexpire(key, LOCKOUT_MS);
      }
      return;
    } catch {
      // fall through to memory
    }
  }
  recordMemoryFailure(ip);
}

export async function clearAdminLoginFailures(ip: string): Promise<void> {
  const client = getRedis();
  if (client) {
    try {
      await client.del(`${KEY_PREFIX}${ip}`);
      return;
    } catch {
      // fall through
    }
  }
  memoryLocks.delete(ip);
}

function assertMemoryAllowed(ip: string): LoginGuardResult {
  const now = Date.now();
  const entry = memoryLocks.get(ip);
  if (!entry) return { allowed: true };
  if (entry.lockedUntil > now && entry.failures >= MAX_FAILURES) {
    return {
      allowed: false,
      retryAfterSec: Math.ceil((entry.lockedUntil - now) / 1000),
    };
  }
  if (entry.lockedUntil <= now) {
    memoryLocks.delete(ip);
  }
  return { allowed: true };
}

function recordMemoryFailure(ip: string): void {
  const now = Date.now();
  const existing = memoryLocks.get(ip);
  if (!existing || existing.lockedUntil <= now) {
    memoryLocks.set(ip, {
      failures: 1,
      lockedUntil: now + LOCKOUT_MS,
    });
    return;
  }
  existing.failures += 1;
  memoryLocks.set(ip, existing);
}
