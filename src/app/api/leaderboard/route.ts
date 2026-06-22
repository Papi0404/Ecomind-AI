import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const leaderboard = await prisma.user.findMany({
      take: 10,
      orderBy: { ecoPoints: 'desc' },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        ecoPoints: true,
        level: true,
        streakCount: true,
      },
    });

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error('Leaderboard API Error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan pada server.' },
      { status: 500 }
    );
  }
}
