import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// PATCH: Accept a friend request
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id: friendshipId } = await params;
    const body = await req.json();
    const { status } = body;

    if (status !== 'ACCEPTED') {
      return NextResponse.json({ message: 'Status tidak valid.' }, { status: 400 });
    }

    // Find friendship
    const friendship = await prisma.friendship.findUnique({
      where: { id: friendshipId },
    });

    if (!friendship) {
      return NextResponse.json({ message: 'Permintaan pertemanan tidak ditemukan.' }, { status: 404 });
    }

    // Ensure current user is the receiver of the friendship request
    if (friendship.receiverId !== user.id) {
      return NextResponse.json({ message: 'Anda tidak diizinkan untuk menerima permintaan ini.' }, { status: 403 });
    }

    // Update friendship status
    const updated = await prisma.friendship.update({
      where: { id: friendshipId },
      data: { status: 'ACCEPTED' },
      include: { sender: true },
    });

    // Notify sender that request was accepted
    await prisma.notification.create({
      data: {
        userId: friendship.senderId,
        title: 'Permintaan Pertemanan Diterima 🎉',
        content: `${user.name} sekarang berteman dengan Anda.`,
      },
    });

    return NextResponse.json({
      message: 'Permintaan pertemanan diterima.',
      friendship: updated,
    });
  } catch (error) {
    console.error('Accept Friend Request API Error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan pada server.' },
      { status: 500 }
    );
  }
}

// DELETE: Decline or delete a friendship
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id: friendshipId } = await params;

    // Find friendship
    const friendship = await prisma.friendship.findUnique({
      where: { id: friendshipId },
    });

    if (!friendship) {
      return NextResponse.json({ message: 'Hubungan tidak ditemukan.' }, { status: 404 });
    }

    // Ensure current user is either sender or receiver
    if (friendship.senderId !== user.id && friendship.receiverId !== user.id) {
      return NextResponse.json({ message: 'Tidak diizinkan.' }, { status: 403 });
    }

    // Delete friendship
    await prisma.friendship.delete({
      where: { id: friendshipId },
    });

    return NextResponse.json({
      message: 'Hubungan pertemanan berhasil dihapus.',
    });
  } catch (error) {
    console.error('Delete Friend API Error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan pada server.' },
      { status: 500 }
    );
  }
}
