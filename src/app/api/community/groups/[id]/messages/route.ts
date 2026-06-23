import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const sendMessageSchema = z.object({
  content: z.string().min(1, 'Pesan tidak boleh kosong'),
  fileUrl: z.string().url().optional().nullable(),
  fileName: z.string().optional().nullable(),
  fileType: z.string().optional().nullable(),
});

// GET: Fetch group messages (for members only)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id: groupId } = await params;

    // Check membership
    const member = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: user.id,
        },
      },
    });

    if (!member) {
      return NextResponse.json({ message: 'Anda bukan anggota grup ini.' }, { status: 403 });
    }

    const messages = await prisma.groupMessage.findMany({
      where: { groupId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Get Group Messages API Error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan pada server.' },
      { status: 500 }
    );
  }
}

// POST: Send message to group (for members only)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id: groupId } = await params;

    // Check membership
    const member = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: user.id,
        },
      },
    });

    if (!member) {
      return NextResponse.json({ message: 'Anda bukan anggota grup ini.' }, { status: 403 });
    }

    const body = await req.json();
    const validation = sendMessageSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { content, fileUrl, fileName, fileType } = validation.data;

    const message = await prisma.groupMessage.create({
      data: {
        groupId,
        senderId: user.id,
        content,
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        fileType: fileType || null,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
    });

    // Update group's updatedAt timestamp
    await prisma.communityGroup.update({
      where: { id: groupId },
      data: { updatedAt: new Date() },
    });

    // Award user +2 points for community interaction
    await prisma.user.update({
      where: { id: user.id },
      data: {
        ecoPoints: { increment: 2 },
        xp: { increment: 2 },
      },
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Send Group Message API Error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan pada server.' },
      { status: 500 }
    );
  }
}
