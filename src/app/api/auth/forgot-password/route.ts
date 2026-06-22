import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateOTP, hashOTP, sendOTPEmail } from '@/lib/mail';
import { z } from 'zod';

const forgotPasswordSchema = z.object({
  email: z.string().email('Format email tidak valid'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate email
    const validation = forgotPasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email } = validation.data;
    const lowerEmail = email.toLowerCase();

    // Find User
    const user = await prisma.user.findUnique({
      where: { email: lowerEmail },
    });

    if (!user) {
      // Return 200 for security reasons (so attackers cannot enumerate emails)
      return NextResponse.json({
        message: 'Jika email Anda terdaftar, kode pemulihan password telah dikirim.',
      });
    }

    // Generate and Hash OTP
    const otp = generateOTP();
    const otpHash = hashOTP(otp);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save to DB
    await prisma.user.update({
      where: { email: lowerEmail },
      data: {
        otpHash,
        otpExpiresAt,
      },
    });

    // Send email (sandbox prints to console)
    await sendOTPEmail(lowerEmail, otp);

    return NextResponse.json({
      message: 'Jika email Anda terdaftar, kode pemulihan password telah dikirim.',
      email: lowerEmail,
    });
  } catch (error) {
    console.error('Forgot Password API Error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan pada server.' },
      { status: 500 }
    );
  }
}
