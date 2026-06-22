import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashOTP } from '@/lib/mail';
import { hashPassword } from '@/lib/security';
import { z } from 'zod';

const resetPasswordSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  otp: z.string().length(6, 'OTP harus 6 digit'),
  newPassword: z.string().min(6, 'Password minimal 6 karakter'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate inputs
    const validation = resetPasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, otp, newPassword } = validation.data;
    const lowerEmail = email.toLowerCase();

    // Find User
    const user = await prisma.user.findUnique({
      where: { email: lowerEmail },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Pengguna tidak ditemukan atau kode salah.' },
        { status: 400 }
      );
    }

    if (!user.otpHash || !user.otpExpiresAt) {
      return NextResponse.json(
        { message: 'Kode OTP tidak aktif atau salah.' },
        { status: 400 }
      );
    }

    // Check expiry
    if (new Date() > user.otpExpiresAt) {
      return NextResponse.json(
        { message: 'Kode OTP telah kedaluwarsa. Silakan minta kode baru.' },
        { status: 400 }
      );
    }

    // Compare Hash
    const inputHash = hashOTP(otp);
    if (inputHash !== user.otpHash) {
      return NextResponse.json(
        { message: 'Kode OTP salah.' },
        { status: 400 }
      );
    }

    // Hash New Password
    const passwordHash = await hashPassword(newPassword);

    // Update in DB and clear OTP fields
    await prisma.user.update({
      where: { email: lowerEmail },
      data: {
        passwordHash,
        otpHash: null,
        otpExpiresAt: null,
      },
    });

    return NextResponse.json({
      message: 'Password Anda berhasil diperbarui. Silakan login dengan password baru.',
    });
  } catch (error) {
    console.error('Reset Password API Error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan pada server.' },
      { status: 500 }
    );
  }
}
