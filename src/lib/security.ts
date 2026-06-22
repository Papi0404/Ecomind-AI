import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';

// 1. Password Hashing
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// 2. Request Sanitization (XSS Mitigation)
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized = { ...obj };
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeString(sanitized[key]) as any;
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeObject(sanitized[key]);
    }
  }
  return sanitized;
}

// 3. Simple In-Memory Rate Limiting (Fallback for Redis)
interface RateLimitRecord {
  tokens: number;
  lastRefill: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

const MAX_TOKENS = 60; // Max requests per minute
const REFILL_RATE = 1; // Refill 1 token per second

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number; reset: number } {
  const now = Date.now();
  let record = rateLimitStore.get(ip);

  if (!record) {
    record = { tokens: MAX_TOKENS, lastRefill: now };
    rateLimitStore.set(ip, record);
  }

  // Calculate elapsed time and refill tokens
  const elapsedMs = now - record.lastRefill;
  const elapsedSec = Math.floor(elapsedMs / 1000);
  
  if (elapsedSec > 0) {
    record.tokens = Math.min(MAX_TOKENS, record.tokens + elapsedSec * REFILL_RATE);
    record.lastRefill = now;
  }

  if (record.tokens >= 1) {
    record.tokens -= 1;
    rateLimitStore.set(ip, record);
    return {
      allowed: true,
      remaining: Math.floor(record.tokens),
      reset: Math.max(0, Math.ceil((MAX_TOKENS - record.tokens) / REFILL_RATE)),
    };
  }

  return {
    allowed: false,
    remaining: 0,
    reset: Math.max(0, Math.ceil((MAX_TOKENS - record.tokens) / REFILL_RATE)),
  };
}

// 4. Security Headers (Helmet equivalents for Next.js)
export const SECURITY_HEADERS = {
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://images.unsplash.com https://i.pravatar.cc https://res.cloudinary.com; connect-src 'self';",
  'X-DNS-Prefetch-Control': 'on',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};
