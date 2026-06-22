import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';

const patchChatSchema = z.object({
  title: z.string().min(1, 'Judul tidak boleh kosong').optional(),
  isPinned: z.boolean().optional(),
});

// GET: Fetch single chat with messages
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const chat = await prisma.chat.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!chat || chat.userId !== user.id) {
      return NextResponse.json({ message: 'Chat tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ chat });
  } catch (error) {
    console.error('Get Chat Messages API Error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan pada server.' },
      { status: 500 }
    );
  }
}

// PATCH: Rename or Pin/Unpin chat
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const validation = patchChatSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const chat = await prisma.chat.findUnique({
      where: { id },
    });

    if (!chat || chat.userId !== user.id) {
      return NextResponse.json({ message: 'Chat tidak ditemukan.' }, { status: 404 });
    }

    const updated = await prisma.chat.update({
      where: { id },
      data: validation.data,
    });

    return NextResponse.json({ chat: updated });
  } catch (error) {
    console.error('Update Chat API Error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan pada server.' },
      { status: 500 }
    );
  }
}

// DELETE: Delete chat thread
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const chat = await prisma.chat.findUnique({
      where: { id },
    });

    if (!chat || chat.userId !== user.id) {
      return NextResponse.json({ message: 'Chat tidak ditemukan.' }, { status: 404 });
    }

    await prisma.chat.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Chat berhasil dihapus.' });
  } catch (error) {
    console.error('Delete Chat API Error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan pada server.' },
      { status: 500 }
    );
  }
}
