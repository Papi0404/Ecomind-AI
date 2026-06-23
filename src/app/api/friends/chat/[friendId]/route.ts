import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const sendDmSchema = z.object({
  content: z.string().min(1).max(2000),
});

// GET: Fetch DMs with a specific friend — SECURITY: verifies friendship before returning any messages
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ friendId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { friendId } = await params;

    // SECURITY: Must be accepted friends to access messages
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: user.id, receiverId: friendId, status: 'ACCEPTED' },
          { senderId: friendId, receiverId: user.id, status: 'ACCEPTED' },
        ],
      },
    });

    if (!friendship) {
      return NextResponse.json({ message: 'Anda hanya dapat melihat pesan dengan teman Anda.' }, { status: 403 });
    }

    // SECURITY: Only fetch messages explicitly between these two users — no wildcard
    const messages = await prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: user.id, receiverId: friendId },
          { senderId: friendId, receiverId: user.id },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });

    // Mark incoming messages as read
    await prisma.directMessage.updateMany({
      where: { senderId: friendId, receiverId: user.id, isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Fetch DM API Error:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}

// POST: Send a direct message
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ friendId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { friendId } = await params;
    const body = await req.json();

    const validation = sendDmSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: validation.error.issues[0].message }, { status: 400 });
    }

    // SECURITY: Verify friendship before allowing message send
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

    const message = await prisma.directMessage.create({
      data: {
        senderId: user.id,
        receiverId: friendId,
        content: validation.data.content.trim(),
        isRead: false,
      },
    });

    // Create a notification for the recipient (fire-and-forget)
    await prisma.notification.create({
      data: {
        userId: friendId,
        title: 'Pesan Baru',
        content: `${user.name}: "${validation.data.content.slice(0, 80)}${validation.data.content.length > 80 ? '…' : ''}"`,
      },
    }).catch(() => {});

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Send DM API Error:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}
