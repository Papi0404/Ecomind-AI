import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET: List friends, requests, and search
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const searchQuery = searchParams.get('search');

    if (searchQuery) {
      // Find users matching search term (excluding self)
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { email: { contains: searchQuery, mode: 'insensitive' } },
            { name: { contains: searchQuery, mode: 'insensitive' } },
          ],
          NOT: { id: user.id },
        },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          level: true,
          streakCount: true,
        },
        take: 10,
      });

      // Filter out existing friendships
      const existingFriendships = await prisma.friendship.findMany({
        where: {
          OR: [
            { senderId: user.id },
            { receiverId: user.id },
          ],
        },
      });

      const friendUserIds = new Set(
        existingFriendships.flatMap(f => [f.senderId, f.receiverId])
      );

      const searchResults = users.map(u => ({
        ...u,
        friendshipStatus: friendUserIds.has(u.id)
          ? existingFriendships.find(f => f.senderId === u.id || f.receiverId === u.id)?.status || 'NONE'
          : 'NONE',
      }));

      return NextResponse.json({ users: searchResults });
    }

    // Get all friendships (both accepted and pending)
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { senderId: user.id },
          { receiverId: user.id },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
            level: true,
            streakCount: true,
            lastActiveAt: true,
          },
        },
        receiver: {
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
            level: true,
            streakCount: true,
            lastActiveAt: true,
          },
        },
      },
    });

    const acceptedFriends: any[] = [];
    const pendingSent: any[] = [];
    const pendingReceived: any[] = [];

    friendships.forEach(f => {
      const isSender = f.senderId === user.id;
      const friend = isSender ? f.receiver : f.sender;

      if (f.status === 'ACCEPTED') {
        acceptedFriends.push({
          friendshipId: f.id,
          id: friend.id,
          name: friend.name,
          email: friend.email,
          avatarUrl: friend.avatarUrl,
          level: friend.level,
          streakCount: friend.streakCount,
          lastActiveAt: friend.lastActiveAt,
        });
      } else if (f.status === 'PENDING') {
        if (isSender) {
          pendingSent.push({
            friendshipId: f.id,
            id: friend.id,
            name: friend.name,
            email: friend.email,
            avatarUrl: friend.avatarUrl,
          });
        } else {
          pendingReceived.push({
            friendshipId: f.id,
            id: friend.id,
            name: friend.name,
            email: friend.email,
            avatarUrl: friend.avatarUrl,
          });
        }
      }
    });

    // Fetch recently completed challenges for accepted friends
    const friendIds = acceptedFriends.map(f => f.id);
    let recentActivities: any[] = [];
    if (friendIds.length > 0) {
      recentActivities = await prisma.userChallenge.findMany({
        where: {
          userId: { in: friendIds },
          status: 'COMPLETED',
        },
        orderBy: {
          loggedAt: 'desc',
        },
        include: {
          challenge: true,
        },
      });
    }

    // Attach recent activity to friends
    acceptedFriends.forEach(f => {
      const act = recentActivities.find(a => a.userId === f.id);
      if (act) {
        f.recentActivity = {
          title: act.challenge.title,
          category: act.challenge.category,
          loggedAt: act.loggedAt,
        };
      }
    });

    return NextResponse.json({
      friends: acceptedFriends,
      pendingSent,
      pendingReceived,
    });
  } catch (error) {
    console.error('Fetch Friends API Error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan pada server.' },
      { status: 500 }
    );
  }
}

// POST: Send friend request
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ message: 'Email target diperlukan.' }, { status: 400 });
    }

    if (email.toLowerCase() === user.email.toLowerCase()) {
      return NextResponse.json({ message: 'Anda tidak dapat berteman dengan diri sendiri.' }, { status: 400 });
    }

    // Find target user
    const targetUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!targetUser) {
      return NextResponse.json({ message: 'Pengguna tidak ditemukan.' }, { status: 404 });
    }

    // Check if friendship already exists
    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: user.id, receiverId: targetUser.id },
          { senderId: targetUser.id, receiverId: user.id },
        ],
      },
    });

    if (existing) {
      if (existing.status === 'ACCEPTED') {
        return NextResponse.json({ message: 'Anda sudah berteman dengan pengguna ini.' }, { status: 400 });
      } else {
        return NextResponse.json({ message: 'Permintaan pertemanan sedang tertunda.' }, { status: 400 });
      }
    }

    // Create friendship request
    const friendship = await prisma.friendship.create({
      data: {
        senderId: user.id,
        receiverId: targetUser.id,
        status: 'PENDING',
      },
    });

    // Create notification for target user
    await prisma.notification.create({
      data: {
        userId: targetUser.id,
        title: 'Permintaan Pertemanan Baru 👥',
        content: `${user.name} mengirimkan Anda permintaan pertemanan.`,
      },
    });

    return NextResponse.json({
      message: 'Permintaan pertemanan berhasil dikirim.',
      friendship,
    });
  } catch (error) {
    console.error('Send Friend Request API Error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan pada server.' },
      { status: 500 }
    );
  }
}
