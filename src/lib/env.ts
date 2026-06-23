/**
 * lib/env.ts
 * -----------
 * Centralized environment variable validation.
 * This module is imported by server-side code only (never from 'use client' files).
 * It throws a FATAL error at startup if any critical variable is missing,
 * preventing the app from silently running in an insecure state.
 *
 * Usage: import '@/lib/env'; at the top of any server entry point (e.g., lib/ai.ts, API routes).
 */

type EnvVar = {
  key: string;
  /** If true, the app cannot function without this variable — throw immediately. */
  critical: boolean;
  /** Human-readable description shown in the error message. */
  description: string;
};

const REQUIRED_ENV_VARS: EnvVar[] = [
  {
    key: 'GEMINI_API_KEY',
    critical: true,
    description: 'Google Gemini API key for AI features',
  },
  {
    key: 'JWT_SECRET',
    critical: true,
    description: 'Secret used to sign/verify JWT session tokens',
  },
  {
    key: 'DATABASE_URL',
    critical: true,
    description: 'PostgreSQL connection string (Supabase or local)',
  },
  {
    key: 'NEXT_PUBLIC_SUPABASE_URL',
    critical: false, // non-critical: only needed for storage features
    description: 'Supabase project URL for client-side storage SDK',
  },
];

// ────────────────────────────────────────────────────────────────────────────
// Only validate on the server side.  Edge runtime and browser builds skip this.
// ────────────────────────────────────────────────────────────────────────────
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
  const missingCritical: string[] = [];
  const missingOptional: string[] = [];

  for (const envVar of REQUIRED_ENV_VARS) {
    const value = process.env[envVar.key];
    if (!value || value.trim() === '') {
      if (envVar.critical) {
        missingCritical.push(`  ✗ ${envVar.key} — ${envVar.description}`);
      } else {
        missingOptional.push(`  ⚠ ${envVar.key} — ${envVar.description}`);
      }
    }
  }

  if (missingOptional.length > 0) {
    console.warn(
      `[EcoMind env] WARNING: Optional environment variable(s) not set:\n${missingOptional.join('\n')}\n` +
        'Some features may be disabled.'
    );
  }

  if (missingCritical.length > 0) {
    throw new Error(
      `\n\n🔴 FATAL: Missing critical environment variable(s):\n${missingCritical.join('\n')}\n\n` +
        'The application cannot start securely without these variables.\n' +
        'Please set them in your .env file or Vercel dashboard.\n'
    );
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Typed accessor helpers — use these instead of process.env directly in code.
// These are guaranteed non-null after the checks above.
// ────────────────────────────────────────────────────────────────────────────
export const env = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY as string,
  JWT_SECRET: process.env.JWT_SECRET as string,
  DATABASE_URL: process.env.DATABASE_URL as string,
  SUPABASE_URL: process.env.SUPABASE_URL ?? '',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY ?? '',
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  /** Optional Redis URL for Upstash rate limiting — falls back to in-memory if absent */
  REDIS_URL: process.env.REDIS_URL ?? '',
  /** Upstash REST endpoint — required when REDIS_URL is set */
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL ?? '',
  /** Upstash REST token — required when REDIS_URL is set */
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN ?? '',
  /** Optional backup Gemini API keys, comma-separated in GEMINI_API_KEY or via GEMINI_API_KEY_BACKUP1..5 */
  GEMINI_BACKUP_KEYS: (() => {
    const keys: string[] = [];
    for (let i = 1; i <= 5; i++) {
      const k = process.env[`GEMINI_API_KEY_BACKUP${i}`];
      if (k?.trim()) keys.push(k.trim());
    }
    return keys;
  })(),
} as const;
