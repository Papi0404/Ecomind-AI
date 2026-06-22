import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all predefined challenges
    const challenges = await prisma.challenge.findMany({
      orderBy: { isWeekly: 'asc' },
    });

    // Fetch user's active and completed challenges
    const userChallenges = await prisma.userChallenge.findMany({
      where: { userId: user.id },
      include: { challenge: true },
    });

    return NextResponse.json({
      challenges,
      userChallenges,
    });
  } catch (error) {
    console.error('Get Challenges API Error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan pada server.' },
      { status: 500 }
    );
  }
}
