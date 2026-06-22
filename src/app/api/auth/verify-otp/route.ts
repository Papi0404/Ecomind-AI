import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashOTP } from '@/lib/mail';
import { createSession } from '@/lib/auth';
import { z } from 'zod';

const verifyOtpSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  otp: z.string().length(6, 'OTP harus 6 digit angka'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate inputs
    const validation = verifyOtpSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, otp } = validation.data;
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
        { message: 'Akun Anda sudah terverifikasi. Silakan login.' },
        { status: 400 }
      );
    }

    if (!user.otpHash || !user.otpExpiresAt) {
      return NextResponse.json(
        { message: 'Kode verifikasi tidak aktif atau telah kedaluwarsa.' },
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

    // Update User to Verified
    const updatedUser = await prisma.user.update({
      where: { email: lowerEmail },
      data: {
        isVerified: true,
        otpHash: null,
        otpExpiresAt: null,
        ecoPoints: 100, // Welcome points
        xp: 100,
      },
    });

    // Create session and set cookie (log user in)
    await createSession(updatedUser.id, updatedUser.email, updatedUser.role, req);

    return NextResponse.json({
      message: 'Akun Anda berhasil diverifikasi. Selamat datang di EcoMind AI!',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        ecoPoints: updatedUser.ecoPoints,
      },
    });
  } catch (error) {
    console.error('Verify OTP API Error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan pada server.' },
      { status: 500 }
    );
  }
}
