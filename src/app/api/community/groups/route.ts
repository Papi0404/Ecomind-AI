import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createGroupSchema = z.object({
  name: z.string().min(3, 'Nama grup minimal 3 karakter').max(50, 'Nama grup maksimal 50 karakter'),
  description: z.string().max(200, 'Deskripsi maksimal 200 karakter').optional(),
  category: z.string().min(2, 'Kategori tidak boleh kosong'),
});

// GET: List all groups with member counts
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const groups = await prisma.communityGroup.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        members: {
          select: {
            userId: true,
            user: {
              select: {
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
    });

    // Map to include a boolean isMember for the current user
    const responseGroups = groups.map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description,
      category: g.category,
      creatorId: g.creatorId,
      createdAt: g.createdAt,
      memberCount: g.members.length,
      isMember: g.members.some((m) => m.userId === user.id),
      messageCount: g._count.messages,
      memberNames: g.members.map((m) => m.user.name).slice(0, 10),
    }));

    return NextResponse.json({ groups: responseGroups });
  } catch (error) {
    console.error('List Groups API Error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan pada server.' },
      { status: 500 }
    );
  }
}

// POST: Create a new group
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validation = createGroupSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, description, category } = validation.data;

    // Start a transaction to create the group and join the creator immediately
    const group = await prisma.$transaction(async (tx) => {
      const g = await tx.communityGroup.create({
        data: {
          name,
          description: description || null,
          category,
          creatorId: user.id,
        },
      });

      await tx.groupMember.create({
        data: {
          groupId: g.id,
          userId: user.id,
        },
      });

      return g;
    });

    return NextResponse.json({ group, message: 'Grup berhasil dibuat.' }, { status: 201 });
  } catch (error) {
    console.error('Create Group API Error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan pada server.' },
      { status: 500 }
    );
  }
}
