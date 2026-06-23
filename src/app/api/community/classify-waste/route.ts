import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { classifyWaste } from '@/lib/ai';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { item } = await req.json();
    if (!item || !item.trim()) {
      return NextResponse.json({ message: 'Nama sampah tidak boleh kosong.' }, { status: 400 });
    }

    const result = await classifyWaste(item.trim());
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Classify Waste API route error:', error);
    return NextResponse.json(
      { message: error.message || 'Gagal mengklasifikasikan sampah.' },
      { status: 500 }
    );
  }
}
