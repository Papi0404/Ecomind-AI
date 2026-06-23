/**
 * lib/rate-limit.ts
 * ------------------
 * Tiered rate limiting for API routes.
 *
 * Priority:
 *  1. Upstash Redis (@upstash/ratelimit) — when REDIS_URL is configured (production).
 *  2. In-memory sliding-window map — fallback for local dev / Vercel preview.
 *
 * Usage:
 *   import { rateLimitCheck } from '@/lib/rate-limit';
 *   const result = await rateLimitCheck(ip, 'gemini');
 *   if (!result.allowed) return rateLimitResponse(result);
 */

import '@/lib/env'; // Ensure env is validated at startup

// ────────────────────────────────────────────────────────────────────────────
// Rate Limit Profiles
// ────────────────────────────────────────────────────────────────────────────
type LimitProfile = 'gemini' | 'auth' | 'default';

const PROFILES: Record<LimitProfile, { requests: number; windowMs: number }> = {
  /** Gemini AI endpoint: 10 req / 60 s per IP */
  gemini: { requests: 10, windowMs: 60_000 },
  /** Login / Register: 10 req / 60 s per IP (brute-force protection) */
  auth: { requests: 10, windowMs: 60_000 },
  /** All other API routes: 120 req / 60 s per IP */
  default: { requests: 120, windowMs: 60_000 },
};

// ────────────────────────────────────────────────────────────────────────────
// Result type
// ────────────────────────────────────────────────────────────────────────────
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Epoch second when the window resets */
  resetAt: number;
}

// ────────────────────────────────────────────────────────────────────────────
// In-Memory Fallback (sliding-window per IP+profile)
// NOTE: This state is per-instance and resets on cold starts.
//       Suitable for dev/staging; use Redis in production.
// ────────────────────────────────────────────────────────────────────────────
interface InMemoryRecord {
  /** Timestamps of recent requests within the window */
  timestamps: number[];
}

const inMemoryStore = new Map<string, InMemoryRecord>();

function inMemoryRateLimit(key: string, requests: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const record = inMemoryStore.get(key) ?? { timestamps: [] };

  // Prune timestamps outside the current window
  const windowStart = now - windowMs;
  record.timestamps = record.timestamps.filter((t) => t > windowStart);

  const resetAt = Math.ceil((record.timestamps[0] ?? now + windowMs) / 1000 + windowMs / 1000);

  if (record.timestamps.length >= requests) {
    inMemoryStore.set(key, record);
    return { allowed: false, remaining: 0, resetAt };
  }

  record.timestamps.push(now);
  inMemoryStore.set(key, record);

  return {
    allowed: true,
    remaining: requests - record.timestamps.length,
    resetAt: Math.ceil((now + windowMs) / 1000),
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Upstash Ratelimit (dynamic import — only loads if REDIS_URL is set)
// ────────────────────────────────────────────────────────────────────────────
// We use `new Function` to create a dynamic import that TypeScript will NOT
// type-check at compile time. This makes @upstash/ratelimit and @upstash/redis
// truly optional runtime dependencies (zero TS errors when not installed).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dynamicImport = new Function('pkg', 'return import(pkg)') as (pkg: string) => Promise<any>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let upstashLimiter: Map<LimitProfile, { limit: (id: string) => Promise<{ success: boolean; remaining: number; reset: number }> }> | null = null;

async function getUpstashLimiter(profile: LimitProfile) {
  if (!process.env.REDIS_URL) return null;

  if (!upstashLimiter) {
    try {
      const { Ratelimit } = await dynamicImport('@upstash/ratelimit');
      const { Redis } = await dynamicImport('@upstash/redis');

      const redis = Redis.fromEnv();
      upstashLimiter = new Map();

      for (const [name, cfg] of Object.entries(PROFILES) as [LimitProfile, typeof PROFILES[LimitProfile]][]) {
        upstashLimiter.set(name, new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(cfg.requests, `${cfg.windowMs / 1000} s`),
          prefix: `ecomind:rl:${name}`,
          analytics: false,
        }));
      }
    } catch (_e) {
      console.warn('[rate-limit] @upstash/ratelimit not installed or Redis init failed — using in-memory fallback.');
      upstashLimiter = null;
    }
  }

  return upstashLimiter?.get(profile) ?? null;
}


// ────────────────────────────────────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────────────────────────────────────
/**
 * Check rate limit for a given IP address and profile.
 * Returns { allowed, remaining, resetAt }.
 */
export async function rateLimitCheck(ip: string, profile: LimitProfile = 'default'): Promise<RateLimitResult> {
  const cfg = PROFILES[profile];
  const key = `${profile}:${ip}`;

  // Try Upstash first
  const upstash = await getUpstashLimiter(profile);
  if (upstash) {
    try {
      const result = await upstash.limit(key);
      return {
        allowed: result.success,
        remaining: result.remaining,
        resetAt: Math.ceil(result.reset / 1000),
      };
    } catch (_e) {
      console.warn('[rate-limit] Upstash call failed — falling back to in-memory.');
    }
  }

  // In-memory fallback
  return inMemoryRateLimit(key, cfg.requests, cfg.windowMs);
}

/**
 * Build a standardised 429 Response with Retry-After header.
 */
export function buildRateLimitResponse(result: RateLimitResult): Response {
  const retryAfter = Math.max(0, result.resetAt - Math.floor(Date.now() / 1000));
  return new Response(
    JSON.stringify({ message: 'Terlalu banyak permintaan. Silakan coba lagi sebentar.' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(result.resetAt),
      },
    }
  );
}
