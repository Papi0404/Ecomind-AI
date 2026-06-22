import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';

const startChallengeSchema = z.object({
  challengeId: z.string().min(1, 'ID Tantangan diperlukan'),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validation = startChallengeSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { challengeId } = validation.data;

    // Check challenge existence
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      return NextResponse.json(
        { message: 'Tantangan tidak ditemukan.' },
        { status: 404 }
      );
    }

    // Check if already active or completed
    const existing = await prisma.userChallenge.findFirst({
      where: {
        userId: user.id,
        challengeId,
        status: 'ACTIVE',
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: 'Tantangan ini sudah aktif di dashboard Anda.' },
        { status: 400 }
      );
    }

    // Create UserChallenge
    const userChallenge = await prisma.userChallenge.create({
      data: {
        userId: user.id,
        challengeId,
        status: 'ACTIVE',
        progressDays: 0,
      },
      include: { challenge: true },
    });

    return NextResponse.json({
      message: `Tantangan "${challenge.title}" berhasil dimulai!`,
      userChallenge,
    });
  } catch (error) {
    console.error('Start Challenge API Error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan pada server.' },
      { status: 500 }
    );
  }
}
