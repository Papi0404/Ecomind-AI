import { NextRequest, NextResponse } from 'next/server';
import { destroySession } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await destroySession();
    return NextResponse.json({ message: 'Logout berhasil.' });
  } catch (error) {
    console.error('Logout API Error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan pada server.' },
      { status: 500 }
    );
  }
}
