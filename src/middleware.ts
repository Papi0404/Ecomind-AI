import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const COOKIE_NAME = 'ecomind_session';
const ADMIN_PATH = process.env.ADMIN_SECRET_PATH || 'root-management-portal-x91';

// Simple JWT payload decoder for route guarding (no crypto verification needed here).
// Full cryptographic JWT verification is handled by API routes via jsonwebtoken library.
function decodeJwtPayload(token: string): { exp?: number; role?: string; userId?: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    // Convert base64url to base64
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4;
    const padded = pad ? base64 + '='.repeat(4 - pad) : base64;

    const decoded = JSON.parse(atob(padded));

    // Check expiration
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      return null;
    }

    return decoded;
  } catch (_e) {
    return null;
  }
}

// Simple Edge-compatible Rate Limiting Heuristic
const ipRequestCounts = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 120; // 120 requests/min

function checkEdgeRateLimit(ip: string): boolean {
  const now = Date.now();
  const clientData = ipRequestCounts.get(ip);

  if (!clientData || now - clientData.windowStart > RATE_LIMIT_WINDOW_MS) {
    ipRequestCounts.set(ip, { count: 1, windowStart: now });
    return true;
  }

  clientData.count += 1;
  if (clientData.count > MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  return true;
}

export async function middleware(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || (request as NextRequest & { ip?: string }).ip || '127.0.0.1';
  
  // 1. Rate Limiting Check
  if (!checkEdgeRateLimit(ip)) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }

  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;
  
  let user = null;
  if (token) {
    user = decodeJwtPayload(token);
  }

  // 2. Security / Route Guards
  
  // Admin Portal Protection
  if (pathname.startsWith(`/${ADMIN_PATH}`)) {
    if (!user || user.role !== 'ADMIN') {
      // Return 404 to avoid revealing the route exists
      return new NextResponse('Not Found', { status: 404 });
    }
  }

  // Protected user dashboard / profile / chat pages
  const isProtectedRoute = [
    '/dashboard',
    '/chat',
    '/challenges',
    '/leaderboard',
    '/profile',
    '/settings',
    '/notifications'
  ].some(route => pathname.startsWith(route));

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from Auth Pages
  const isAuthRoute = [
    '/login',
    '/register',
    '/verify-otp',
    '/forgot-password',
    '/reset-password'
  ].some(route => pathname.startsWith(route));

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // 3. Inject Security Headers
  const response = NextResponse.next();
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - uploads (uploaded files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|uploads).*)',
  ],
};
