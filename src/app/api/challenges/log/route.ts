import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';

const logChallengeSchema = z.object({
  userChallengeId: z.string().min(1, 'ID Tantangan pengguna diperlukan'),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validation = logChallengeSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { userChallengeId } = validation.data;

    // Fetch user challenge
    const userChallenge = await prisma.userChallenge.findUnique({
      where: { id: userChallengeId },
      include: { challenge: true },
    });

    if (!userChallenge || userChallenge.userId !== user.id) {
      return NextResponse.json(
        { message: 'Tantangan tidak ditemukan.' },
        { status: 404 }
      );
    }

    if (userChallenge.status !== 'ACTIVE') {
      return NextResponse.json(
        { message: 'Tantangan ini sudah diselesaikan atau gagal.' },
        { status: 400 }
      );
    }

    // Prevent logging progress for the SAME challenge more than once on the same calendar day
    const today = new Date();
    if (userChallenge.loggedAt) {
      const lastLogged = new Date(userChallenge.loggedAt);
      if (
        lastLogged.getDate() === today.getDate() &&
        lastLogged.getMonth() === today.getMonth() &&
        lastLogged.getFullYear() === today.getFullYear()
      ) {
        return NextResponse.json(
          { message: 'Anda sudah mencatat progres untuk tantangan ini hari ini. Silakan catat kembali besok!' },
          { status: 400 }
        );
      }
    }

    // 1. Increment progress
    const newProgress = userChallenge.progressDays + 1;
    const isCompleted = newProgress >= userChallenge.challenge.durationDays;

    let challengeStatus = 'ACTIVE';
    let message = `Kemajuan dicatat! (${newProgress}/${userChallenge.challenge.durationDays} hari)`;
    let pointsAwarded = 0;
    let xpAwarded = 0;

    if (isCompleted) {
      challengeStatus = 'COMPLETED';
      pointsAwarded = userChallenge.challenge.pointsReward;
      xpAwarded = userChallenge.challenge.pointsReward; // XP matches EcoPoints
      message = `Selamat! Anda menyelesaikan tantangan "${userChallenge.challenge.title}" dan mendapatkan ${pointsAwarded} EcoPoints! 🎉`;
    }

    // Update UserChallenge
    await prisma.userChallenge.update({
      where: { id: userChallengeId },
      data: {
        progressDays: newProgress,
        status: challengeStatus,
        loggedAt: new Date(),
      },
    });

    // 2. Perform Gamification calculations
    let newEcoPoints = user.ecoPoints + pointsAwarded;
    let newXp = user.xp + xpAwarded;
    let newLevel = user.level;
    let notificationsToCreate: { title: string; content: string; userId: string }[] = [];

    // Streak Check (Calculated based on calendar day difference)
    let newStreak = user.streakCount;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    if (user.lastActiveAt) {
      const lastActiveDate = new Date(user.lastActiveAt);
      lastActiveDate.setHours(0, 0, 0, 0);
      
      const oneDayMs = 24 * 60 * 60 * 1000;
      const diffTime = todayStart.getTime() - lastActiveDate.getTime();
      const diffDays = Math.round(diffTime / oneDayMs);
      
      if (diffDays === 1) {
        // Consecutive calendar day
        newStreak += 1;
      } else if (diffDays > 1) {
        // Broke the streak, reset to 1
        newStreak = 1;
      }
      // If diffDays === 0, they already logged a challenge today, so streak remains unchanged
    } else {
      newStreak = 1;
    }

    // Level-up Calculation (threshold: level * 500 XP)
    let tempLevel = newLevel;
    let tempXp = newXp;
    while (true) {
      const xpNeeded = tempLevel * 500;
      if (tempXp >= xpNeeded) {
        tempXp -= xpNeeded;
        tempLevel += 1;
        notificationsToCreate.push({
          userId: user.id,
          title: 'Level Naik! ⚡',
          content: `Selamat! Anda telah naik ke Level ${tempLevel}. Teruskan aksi ramah lingkungan Anda!`,
        });
      } else {
        break;
      }
    }
    newLevel = tempLevel;
    newXp = tempXp;

    // Create challenge completion notification
    if (isCompleted) {
      notificationsToCreate.push({
        userId: user.id,
        title: 'Tantangan Selesai! 🌱',
        content: `Anda berhasil menyelesaikan "${userChallenge.challenge.title}" dan memperoleh ${pointsAwarded} EcoPoints.`,
      });
    }

    // Save user state changes
    await prisma.user.update({
      where: { id: user.id },
      data: {
        ecoPoints: newEcoPoints,
        xp: newXp,
        level: newLevel,
        streakCount: newStreak,
        lastActiveAt: new Date(),
      },
    });

    // 3. Check for newly earned Badges
    const completedChallengesCount = await prisma.userChallenge.count({
      where: {
        userId: user.id,
        status: 'COMPLETED',
      },
    });

   // Get badges the user doesn't have yet
const earnedBadgeIds = (await prisma.userBadge.findMany({
  where: { userId: user.id },
  select: { badgeId: true },
})).map((b: any) => b.badgeId);

const availableBadges = await prisma.badge.findMany({
  where: {
    id: { notIn: earnedBadgeIds },
  },
});

    // Evaluate badges
    for (const badge of availableBadges) {
      let qualifies = false;
      if (badge.reqType === 'POINTS' && newEcoPoints >= badge.reqValue) {
        qualifies = true;
      } else if (badge.reqType === 'STREAK' && newStreak >= badge.reqValue) {
        qualifies = true;
      } else if (badge.reqType === 'CHALLENGES' && completedChallengesCount >= badge.reqValue) {
        qualifies = true;
      }

      if (qualifies) {
        // Earn Badge
        await prisma.userBadge.create({
          data: {
            userId: user.id,
            badgeId: badge.id,
          },
        });

        notificationsToCreate.push({
          userId: user.id,
          title: `Lencana Baru Terbuka! ${badge.icon}`,
          content: `Selamat! Anda mendapatkan lencana "${badge.name}": ${badge.description}`,
        });
      }
    }

    // Save all pending notifications in database
    if (notificationsToCreate.length > 0) {
      await prisma.notification.createMany({
        data: notificationsToCreate,
      });
    }

    return NextResponse.json({
      message,
      isCompleted,
      progressDays: newProgress,
      userUpdates: {
        ecoPoints: newEcoPoints,
        level: newLevel,
        xp: newXp,
        streakCount: newStreak,
      },
      notifications: notificationsToCreate,
    });
  } catch (error) {
    console.error('Log Challenge API Error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan pada server.' },
      { status: 500 }
    );
  }
}
