import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateOTP, hashOTP, sendOTPEmail } from '@/lib/mail';
import { z } from 'zod';

const resendSchema = z.object({
  email: z.string().email('Format email tidak valid'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate email
    const validation = resendSchema.safeParse(body);
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
      return NextResponse.json(
        { message: 'Pengguna tidak ditemukan.' },
        { status: 404 }
      );
    }

    if (user.isVerified) {
      return NextResponse.json(
        { message: 'Akun Anda sudah terverifikasi.' },
        { status: 400 }
      );
    }

    // Anti-spam check: limit requests to once every 2 minutes
    // Total lifespan is 10 minutes, so if expiresAt is > 8 mins, it means it's requested within last 2 mins
    if (user.otpExpiresAt) {
      const differenceMs = user.otpExpiresAt.getTime() - Date.now();
      const differenceMins = differenceMs / (60 * 1000);
      if (differenceMins > 8) {
        return NextResponse.json(
          { message: 'Silakan tunggu 2 menit sebelum meminta kode OTP kembali.' },
          { status: 429 }
        );
      }
    }

    // Generate and Hash New OTP
    const otp = generateOTP();
    const otpHash = hashOTP(otp);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update in DB
    await prisma.user.update({
      where: { email: lowerEmail },
      data: {
        otpHash,
        otpExpiresAt,
      },
    });

    // Send Email
    await sendOTPEmail(lowerEmail, otp);

    return NextResponse.json({
      message: 'Kode OTP baru telah dikirim ke email Anda.',
    });
  } catch (error) {
    console.error('Resend OTP API Error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan pada server.' },
      { status: 500 }
    );
  }
}
