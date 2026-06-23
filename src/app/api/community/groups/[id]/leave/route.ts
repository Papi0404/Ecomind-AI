import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

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

    // Check if group exists
    const group = await prisma.communityGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return NextResponse.json({ message: 'Grup tidak ditemukan.' }, { status: 404 });
    }

    // Check if a member
    const existingMember = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: user.id,
        },
      },
    });

    if (!existingMember) {
      return NextResponse.json({ message: 'Anda belum bergabung dalam grup ini.' }, { status: 400 });
    }

    // Delete membership
    await prisma.groupMember.delete({
      where: {
        groupId_userId: {
          groupId,
          userId: user.id,
        },
      },
    });

    return NextResponse.json({ message: 'Berhasil keluar dari grup.' });
  } catch (error) {
    console.error('Leave Group API Error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan pada server.' },
      { status: 500 }
    );
  }
}
