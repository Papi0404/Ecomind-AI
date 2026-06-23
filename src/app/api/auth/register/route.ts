import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/security';
import { generateOTP, hashOTP, sendOTPEmail } from '@/lib/mail';
import { rateLimitCheck, buildRateLimitResponse } from '@/lib/rate-limit';
import { z } from 'zod';

const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'Nama minimal 2 karakter')
    .max(50)
    .regex(/^[\p{L}\s'-]+$/u, 'Nama hanya boleh berisi huruf, spasi, tanda hubung, atau apostrof'),
  email: z.string().email('Format email tidak valid').max(254),
  password: z
    .string()
    .min(8, 'Password minimal 8 karakter')
    .max(128, 'Password maksimal 128 karakter'),
});

export async function POST(req: NextRequest) {
  // Per-IP rate limiting: 10 req/min (brute-force / account harvesting protection)
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    (req as NextRequest & { ip?: string }).ip ??
    '127.0.0.1';

  const rateResult = await rateLimitCheck(ip, 'auth');
  if (!rateResult.allowed) return buildRateLimitResponse(rateResult);

  try {
    const body = await req.json();

    // Validate inputs
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, password } = validation.data;
    const lowerEmail = email.toLowerCase();

    // ── User Enumeration Prevention ──────────────────────────────────────────
    // We ALWAYS respond with the same success message and status code, whether
    // the email is already registered or not. This prevents attackers from
    // probing which email addresses exist in our database.
    const existingUser = await prisma.user.findUnique({ where: { email: lowerEmail } });

    if (existingUser) {
      // Silently do nothing, but return the same success message so the client
      // cannot distinguish between "new account" and "existing email".
      // A legitimate user who already registered will notice they never get an
      // OTP and can use the "forgot password" flow instead.
      return NextResponse.json({
        message: 'Jika email ini belum terdaftar, kode OTP 6-digit akan segera dikirim.',
        email: lowerEmail,
      });
    }

    // Hash Password
    const passwordHash = await hashPassword(password);

    // Generate and Hash OTP
    const otp = generateOTP();
    const otpHash = hashOTP(otp);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create User (isVerified = false)
    await prisma.user.create({
      data: {
        name,
        email: lowerEmail,
        passwordHash,
        isVerified: false,
        otpHash,
        otpExpiresAt,
      },
    });

    // Send verification email
    const emailSent = await sendOTPEmail(lowerEmail, otp);
    if (!emailSent) {
      console.warn('[register] Failed to send OTP email — running in sandbox/console mode.');
    }

    return NextResponse.json({
      message: 'Jika email ini belum terdaftar, kode OTP 6-digit akan segera dikirim.',
      email: lowerEmail,
    });
  } catch (error) {
    console.error('[register] API Error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan pada server.' },
      { status: 500 }
    );
  }
}
