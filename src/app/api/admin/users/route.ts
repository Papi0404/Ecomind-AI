import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';

const adminUserActionSchema = z.object({
  userId: z.string().min(1),
  action: z.enum(['BAN', 'UNBAN', 'MAKE_ADMIN', 'MAKE_USER', 'DELETE']),
});

// GET: Fetch all users
export async function GET(req: NextRequest) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== 'ADMIN') {
      return new NextResponse('Not Found', { status: 404 });
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        level: true,
        ecoPoints: true,
        streakCount: true,
        isVerified: true,
        createdAt: true,
        lastActiveAt: true,
      },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Admin Fetch Users API Error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan pada server.' },
      { status: 500 }
    );
  }
}

// POST: Execute moderation action
export async function POST(req: NextRequest) {
  try {
    const admin = await getCurrentUser();
    if (!admin || admin.role !== 'ADMIN') {
      return new NextResponse('Not Found', { status: 404 });
    }

    const body = await req.json();
    const validation = adminUserActionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { userId, action } = validation.data;

    // Prevent admin self-action
    if (userId === admin.id) {
      return NextResponse.json(
        { message: 'Anda tidak dapat mengubah status akun Anda sendiri.' },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json(
        { message: 'Target pengguna tidak ditemukan.' },
        { status: 404 }
      );
    }

    const ipAddress = req.headers.get('x-forwarded-for') || (req as any).ip || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Unknown';

    let details = '';

    if (action === 'DELETE') {
      await prisma.user.delete({ where: { id: userId } });
      details = `Deleted user ${targetUser.email} (${targetUser.name})`;
    } else {
      let newRole = targetUser.role;
      if (action === 'BAN') newRole = 'BANNED';
      if (action === 'UNBAN') newRole = 'USER';
      if (action === 'MAKE_ADMIN') newRole = 'ADMIN';
      if (action === 'MAKE_USER') newRole = 'USER';

      await prisma.user.update({
        where: { id: userId },
        data: { role: newRole },
      });

      // Clear sessions if banned
      if (action === 'BAN') {
        await prisma.session.deleteMany({ where: { userId } });
      }

      details = `Changed role of user ${targetUser.email} to ${newRole}`;
    }

    // Log Admin Action
    await prisma.adminLog.create({
      data: {
        userId: admin.id,
        action: `ADMIN_${action}`,
        ipAddress,
        userAgent,
        details,
      },
    });

    return NextResponse.json({
      message: `Tindakan ${action} berhasil dilakukan.`,
    });
  } catch (error) {
    console.error('Admin Moderation Action API Error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan pada server.' },
      { status: 500 }
    );
  }
}
