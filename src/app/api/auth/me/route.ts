import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ user: null });
    }

    // Exclude password hash from response
    const { passwordHash, otpHash, otpExpiresAt, ...userResponse } = user as any;

    return NextResponse.json({ user: userResponse });
  } catch (error) {
    console.error('Auth Me API Error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan pada server.' },
      { status: 500 }
    );
  }
}
