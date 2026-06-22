import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { hashPassword, comparePassword } from '@/lib/security';
import { z } from 'zod';

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').optional(),
  bio: z.string().max(160, 'Bio maksimal 160 karakter').optional(),
  email: z.string().email('Format email tidak valid').optional(),
  oldPassword: z.string().optional(),
  newPassword: z.string().min(6, 'Password baru minimal 6 karakter').optional(),
});

// GET: Retrieve Profile Info
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Get Profile API Error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan pada server.' },
      { status: 500 }
    );
  }
}

// PUT: Update Profile Info
export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validation = updateProfileSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, bio, email, oldPassword, newPassword } = validation.data;
    const updateData: any = {};

    if (name) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;

    // Handle Email Change
    if (email && email.toLowerCase() !== user.email) {
      const lowerEmail = email.toLowerCase();
      // Check duplicate email
      const existing = await prisma.user.findUnique({
        where: { email: lowerEmail },
      });
      if (existing) {
        return NextResponse.json(
          { message: 'Email tersebut sudah terdaftar.' },
          { status: 400 }
        );
      }
      updateData.email = lowerEmail;
    }

    // Handle Password Change
    if (newPassword) {
      if (!oldPassword) {
        return NextResponse.json(
          { message: 'Password lama harus diisi untuk memperbarui password.' },
          { status: 400 }
        );
      }

      const match = await comparePassword(oldPassword, user.passwordHash);
      if (!match) {
        return NextResponse.json(
          { message: 'Password lama salah.' },
          { status: 400 }
        );
      }

      updateData.passwordHash = await hashPassword(newPassword);
    }

    // Update in DB
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
    });

    return NextResponse.json({
      message: 'Profil berhasil diperbarui.',
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        bio: updated.bio,
        avatarUrl: updated.avatarUrl,
        bannerUrl: updated.bannerUrl,
        ecoPoints: updated.ecoPoints,
        level: updated.level,
        xp: updated.xp,
        streakCount: updated.streakCount,
      },
    });
  } catch (error) {
    console.error('Update Profile API Error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan pada server.' },
      { status: 500 }
    );
  }
}
