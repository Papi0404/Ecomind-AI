import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { uploadFile } from '@/lib/upload';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string | null; // 'avatar' or 'banner' or 'proof'

    if (!file) {
      return NextResponse.json(
        { message: 'Berkas tidak ditemukan dalam permintaan.' },
        { status: 400 }
      );
    }

    if (!type || !['avatar', 'banner', 'proof'].includes(type)) {
      return NextResponse.json(
        { message: 'Tipe unggahan tidak valid.' },
        { status: 400 }
      );
    }

    // Call Upload Helper (handles security, limits, local storage, DB metadata logs)
    const result = await uploadFile(file, user.id);

    // Update User Record if type is avatar or banner
    if (type === 'avatar') {
      await prisma.user.update({
        where: { id: user.id },
        data: { avatarUrl: result.url },
      });
    } else if (type === 'banner') {
      await prisma.user.update({
        where: { id: user.id },
        data: { bannerUrl: result.url },
      });
    }

    return NextResponse.json({
      message: 'Berkas berhasil diunggah.',
      url: result.url,
    });
  } catch (error: any) {
    console.error('File Upload API Error:', error);
    return NextResponse.json(
      { message: error.message || 'Gagal mengunggah berkas.' },
      { status: 400 }
    );
  }
}
