import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// GET: Fetch direct messages with a friend
export async function GET(
  req: NextRequest,
  { params }: { params: { friendId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { friendId } = params;

    // Check if friendship exists and is accepted
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: user.id, receiverId: friendId, status: 'ACCEPTED' },
          { senderId: friendId, receiverId: user.id, status: 'ACCEPTED' },
        ],
      },
    });

    if (!friendship) {
      return NextResponse.json({ message: 'Anda hanya dapat mengirim pesan kepada teman Anda.' }, { status: 403 });
    }

    // Get messages
    const messages = await prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: user.id, receiverId: friendId },
          { senderId: friendId, receiverId: user.id },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });

    // Mark messages from friend as read
    await prisma.directMessage.updateMany({
      where: {
        senderId: friendId,
        receiverId: user.id,
        isRead: false,
      },
      data: { isRead: true },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Fetch Direct Messages API Error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan pada server.' },
      { status: 500 }
    );
  }
}

// POST: Send direct message
export async function POST(
  req: NextRequest,
  { params }: { params: { friendId: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { friendId } = params;
    const body = await req.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ message: 'Pesan tidak boleh kosong.' }, { status: 400 });
    }

    // Check if friendship exists and is accepted
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: user.id, receiverId: friendId, status: 'ACCEPTED' },
          { senderId: friendId, receiverId: user.id, status: 'ACCEPTED' },
        ],
      },
    });

    if (!friendship) {
      return NextResponse.json({ message: 'Anda hanya dapat mengirim pesan kepada teman Anda.' }, { status: 403 });
    }

    // Create message
    const message = await prisma.directMessage.create({
      data: {
        senderId: user.id,
        receiverId: friendId,
        content: content.trim(),
      },
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Send Direct Message API Error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan pada server.' },
      { status: 500 }
    );
  }
}
