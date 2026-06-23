import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// DELETE: Delete a group (only by creator or admin)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { id: groupId } = await params;

    const group = await prisma.communityGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return NextResponse.json({ message: 'Grup tidak ditemukan.' }, { status: 404 });
    }

    // Only the creator or a platform admin can delete
    const isCreator = group.creatorId === user.id;
    const isAdmin = (user as any).role === 'ADMIN';

    if (!isCreator && !isAdmin) {
      return NextResponse.json(
        { message: 'Hanya pembuat grup atau admin yang dapat menghapus grup ini.' },
        { status: 403 }
      );
    }

    // Cascade delete all messages and members via Prisma relations (onDelete: Cascade)
    await prisma.communityGroup.delete({ where: { id: groupId } });

    return NextResponse.json({ message: 'Grup berhasil dihapus.' });
  } catch (error) {
    console.error('Delete Group API Error:', error);
    return NextResponse.json({ message: 'Terjadi kesalahan pada server.' }, { status: 500 });
  }
}
