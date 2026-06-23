import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { summarizeProcedure } from '@/lib/ai';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { text } = await req.json();
    if (!text || !text.trim()) {
      return NextResponse.json({ message: 'Teks prosedur tidak boleh kosong.' }, { status: 400 });
    }

    const summary = await summarizeProcedure(text.trim());
    return NextResponse.json({ summary });
  } catch (error: any) {
    console.error('Summarize API route error:', error);
    return NextResponse.json(
      { message: error.message || 'Gagal meringkas prosedur.' },
      { status: 500 }
    );
  }
}
