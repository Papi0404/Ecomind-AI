import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';

const createReportSchema = z.object({
  category: z.enum(['Bug', 'Content', 'User']),
  description: z.string().min(10, 'Deskripsi laporan minimal 10 karakter'),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validation = createReportSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { category, description } = validation.data;

    const report = await prisma.report.create({
      data: {
        userId: user.id,
        category,
        description,
      },
    });

    return NextResponse.json({
      message: 'Laporan Anda berhasil dikirim dan akan segera diproses oleh admin.',
      report,
    }, { status: 201 });
  } catch (error) {
    console.error('Submit Report API Error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan pada server.' },
      { status: 500 }
    );
  }
}
