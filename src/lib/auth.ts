import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { prisma } from './prisma';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'ecomind_jwt_secret_rotation_key_12345!';
const COOKIE_NAME = 'ecomind_session';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

// 1. Sign JWT Token
export function signToken(payload: TokenPayload, expiresIn: string = '7d'): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: expiresIn as any });
}

// 2. Verify JWT Token
export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}

// 3. Create Session in Database & Cookie
export async function createSession(
  userId: string,
  email: string,
  role: string,
  req: NextRequest
): Promise<string> {
  // Add a small jitter (random ms) to ensure unique JWT iat per call
  await new Promise(r => setTimeout(r, Math.floor(Math.random() * 10) + 1));
  const token = signToken({ userId, email, role });
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const userAgent = req.headers.get('user-agent') || 'Unknown';
  const ipAddress = req.headers.get('x-forwarded-for') || (req as any).ip || '127.0.0.1';

  // Delete existing sessions for this user to avoid stale/duplicate sessions
  await prisma.session.deleteMany({ where: { userId } });

  // Save new session to Database
  await prisma.session.create({
    data: {
      userId,
      token,
      userAgent,
      ipAddress,
      expiresAt,
    },
  });

  // Track activity
  await prisma.user.update({
    where: { id: userId },
    data: { lastActiveAt: new Date() },
  });

  // Set Cookie
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });

  // Log active login in Admin Audit Log
  await prisma.adminLog.create({
    data: {
      userId,
      action: 'USER_LOGIN',
      ipAddress,
      userAgent,
      details: `User logged in from IP ${ipAddress}`,
    },
  });

  return token;
}

// 4. Destroy Session (Logout)
export async function destroySession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (token) {
    // Delete from Database
    try {
      await prisma.session.delete({
        where: { token },
      });
    } catch (e) {
      // Ignored if session already deleted
    }
  }

  // Clear Cookie
  cookieStore.delete(COOKIE_NAME);
  return true;
}

// 5. Get Current Authenticated User
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  // Verify session in database
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    // Expired or cleared session
    if (session) {
      await prisma.session.delete({ where: { token } });
    }
    cookieStore.delete(COOKIE_NAME);
    return null;
  }

  // Check if user is banned (optional check)
  if (session.user.role === 'BANNED') {
    cookieStore.delete(COOKIE_NAME);
    return null;
  }

  return session.user;
}
