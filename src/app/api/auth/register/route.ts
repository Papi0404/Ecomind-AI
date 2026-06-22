import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/security';
import { generateOTP, hashOTP, sendOTPEmail } from '@/lib/mail';
import { z } from 'zod';

const registerSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').max(50),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate Inputs
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, password } = validation.data;
    const lowerEmail = email.toLowerCase();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: lowerEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'Email sudah terdaftar. Silakan login atau verifikasi akun Anda.' },
        { status: 400 }
      );
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

    // Send verification email (will print to console in sandbox mode)
    const emailSent = await sendOTPEmail(lowerEmail, otp);
    if (!emailSent) {
      console.warn('Failed to send verification email, but user was created in sandbox.');
    }

    return NextResponse.json({
      message: 'Registrasi berhasil. Kode OTP 6-digit telah dikirim ke email Anda.',
      email: lowerEmail,
    });
  } catch (error) {
    console.error('Registration API Error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan pada server.' },
      { status: 500 }
    );
  }
}
