import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { verifyClaim } from '@/lib/ai';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { claim } = await req.json();
    if (!claim || !claim.trim()) {
      return NextResponse.json({ message: 'Konten klaim tidak boleh kosong.' }, { status: 400 });
    }

    const result = await verifyClaim(claim.trim());
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Verify API route error:', error);
    return NextResponse.json(
      { message: error.message || 'Gagal memverifikasi informasi.' },
      { status: 500 }
    );
  }
}
