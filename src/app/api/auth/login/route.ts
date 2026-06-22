import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword } from '@/lib/security';
import { createSession } from '@/lib/auth';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Password harus diisi'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate inputs
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;
    const lowerEmail = email.toLowerCase();

    // Find User
    const user = await prisma.user.findUnique({
      where: { email: lowerEmail },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Email atau password salah.' },
        { status: 401 }
      );
    }

    // Verify Password
    const passwordMatch = await comparePassword(password, user.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json(
        { message: 'Email atau password salah.' },
        { status: 401 }
      );
    }

    // Check if account is verified
    if (!user.isVerified) {
      return NextResponse.json(
        { 
          message: 'Akun Anda belum diverifikasi. Silakan masukkan kode OTP Anda.',
          unverified: true,
          email: user.email
        },
        { status: 403 }
      );
    }

    // Create session and cookie
    await createSession(user.id, user.email, user.role, req);

    return NextResponse.json({
      message: 'Login berhasil.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        ecoPoints: user.ecoPoints,
      },
    });
  } catch (error) {
    console.error('Login API Error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan pada server.' },
      { status: 500 }
    );
  }
}
