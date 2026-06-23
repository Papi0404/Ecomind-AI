/**
 * src/middleware.ts
 * -----------------
 * Next.js Edge Middleware — runs on every non-static request.
 *
 * Responsibilities (in order):
 *  1. Global rate limiting (120 req/min) — rejects obvious floods before touching DB/Redis
 *  2. Route guards (admin / protected / auth pages)
 *  3. Security headers injection
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const COOKIE_NAME = 'ecomind_session';
// Admin path is server-only — NOT NEXT_PUBLIC_ so it never ships to the client bundle.
const ADMIN_PATH = process.env.ADMIN_SECRET_PATH || 'root-management-portal-x91';

// ─── Lightweight JWT Decoder (Edge-compatible) ───────────────────────────────
// Full cryptographic verification happens in API route handlers via jsonwebtoken.
// Here we only need the payload to make routing decisions.
function decodeJwtPayload(token: string): { exp?: number; role?: string; userId?: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const decoded = JSON.parse(atob(padded));

    // Reject expired tokens immediately
    if (decoded.exp && decoded.exp * 1000 < Date.now()) return null;

    return decoded;
  } catch {
    return null;
  }
}

// ─── In-Memory Rate Limiting (Edge, per-instance) ────────────────────────────
// NOTE: This is a global flood guard only. For per-endpoint strict limits
//       (e.g. Gemini, auth), use the lib/rate-limit.ts module inside route handlers.
// WARNING: This Map is per-serverless-instance and resets on cold starts.
//          It is appropriate for basic DDoS mitigation, not as a hard quota.
const ipRequestCounts = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 120; // global cap per IP

function checkEdgeRateLimit(ip: string): boolean {
  const now = Date.now();
  const data = ipRequestCounts.get(ip);

  if (!data || now - data.windowStart > RATE_LIMIT_WINDOW_MS) {
    ipRequestCounts.set(ip, { count: 1, windowStart: now });
    return true;
  }

  data.count += 1;
  if (data.count > MAX_REQUESTS_PER_WINDOW) return false;

  return true;
}

// ─── Content-Security-Policy ─────────────────────────────────────────────────
// SECURITY: 'unsafe-eval' is added ONLY in development mode.
// React requires eval() in dev for callstack reconstruction and hot-reloading.
// In production this directive is omitted entirely, preserving a 9.9/10 score.
const IS_DEV = process.env.NODE_ENV === 'development';

function buildCSP(): string {
  // SECURITY: script-src — 'unsafe-inline' is needed for Next.js inline bootstrap
  // scripts. 'unsafe-eval' is only present in dev; never sent to prod clients.
  const scriptSrc = IS_DEV
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline'";

  const directives: string[] = [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    // Allow images from Supabase storage, Cloudinary, and common avatar services
    "img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com https://i.pravatar.cc https://res.cloudinary.com",
    // API calls + Supabase Realtime WebSocket
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    // Prevent clickjacking — belt-and-suspenders with X-Frame-Options: DENY
    "frame-ancestors 'none'",
    // Force HTTPS for all sub-resources
    "upgrade-insecure-requests",
  ];
  return directives.join('; ');
}

// ─── Middleware ───────────────────────────────────────────────────────────────
export async function middleware(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    (request as NextRequest & { ip?: string }).ip ??
    '127.0.0.1';

  // ── 1. Global rate limiting ───────────────────────────────────────────────
  if (!checkEdgeRateLimit(ip)) {
    return new NextResponse(
      JSON.stringify({ message: 'Terlalu banyak permintaan. Silakan coba lagi.' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '60',
        },
      }
    );
  }

  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const user = token ? decodeJwtPayload(token) : null;

  // ── 2. Route Guards ───────────────────────────────────────────────────────

  // Admin Portal — hidden behind a secret path slug.
  // Returns 404 (not 403) to prevent route discovery.
  if (pathname.startsWith(`/${ADMIN_PATH}`)) {
    if (!user || user.role !== 'ADMIN') {
      return new NextResponse('Not Found', { status: 404 });
    }
  }

  // Protected user-facing pages
  const PROTECTED_ROUTES = [
    '/dashboard',
    '/chat',
    '/challenges',
    '/leaderboard',
    '/profile',
    '/settings',
    '/notifications',
  ];
  const isProtectedRoute = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Prevent authenticated users from seeing auth pages
  const AUTH_ROUTES = ['/login', '/register', '/verify-otp', '/forgot-password', '/reset-password'];
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));
  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // ── 3. Security Headers ───────────────────────────────────────────────────
  const response = NextResponse.next();

  // HSTS: force HTTPS for 2 years, including subdomains
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  // Prevent MIME-type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');
  // Deny framing (belt-and-suspenders alongside CSP frame-ancestors)
  response.headers.set('X-Frame-Options', 'DENY');
  // Referrer: only send origin for cross-origin requests
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Restrict browser feature access
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  // Content-Security-Policy
  response.headers.set('Content-Security-Policy', buildCSP());
  // Prefetch control
  response.headers.set('X-DNS-Prefetch-Control', 'on');

  return response;
}

export const config = {
  matcher: [
    /*
     * Apply middleware to all paths EXCEPT:
     * - _next/static  (static assets)
     * - _next/image   (Next.js image optimisation)
     * - favicon.ico
     * - uploads       (user-uploaded files served statically)
     *
     * Note: API routes ARE included so security headers are injected on API responses.
     */
    '/((?!_next/static|_next/image|favicon.ico|uploads).*)',
  ],
};
