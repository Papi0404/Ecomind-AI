import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    // Admin Guard
    if (!user || user.role !== 'ADMIN') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { reportId, responseMessage } = body;

    if (!reportId || !responseMessage || !responseMessage.trim()) {
      return NextResponse.json(
        { message: 'ID laporan dan pesan tanggapan wajib diisi.' },
        { status: 400 }
      );
    }

    // Find the report
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: { user: true },
    });

    if (!report) {
      return NextResponse.json(
        { message: 'Laporan tidak ditemukan.' },
        { status: 404 }
      );
    }

    // Update report
    await prisma.report.update({
      where: { id: reportId },
      data: {
        response: responseMessage.trim(),
        status: 'RESOLVED',
      },
    });

    // Format local date for notification
    const reportDate = new Date(report.createdAt).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const categoryLabel = report.category;
    const truncatedDesc = report.description.length > 60 
      ? `${report.description.slice(0, 60)}...`
      : report.description;

    // Create Notification for the reporter
    await prisma.notification.create({
      data: {
        userId: report.userId,
        title: 'Tanggapan Laporan Anda 📬',
        content: `Laporan Anda tanggal ${reportDate} tentang [${categoryLabel}] "${truncatedDesc}", Balasan admin: "${responseMessage.trim()}"`,
      },
    });

    // Create Admin Audit Log
    await prisma.adminLog.create({
      data: {
        userId: user.id,
        action: 'RESPOND_REPORT',
        details: `Menanggapi laporan ID ${reportId} dari ${report.user.name}.`,
      },
    });

    return NextResponse.json({
      message: 'Tanggapan berhasil dikirim dan notifikasi telah diteruskan ke pengguna.',
    });
  } catch (error: any) {
    console.error('Admin Report Response API Error:', error);
    return NextResponse.json(
      { message: error.message || 'Terjadi kesalahan pada server.' },
      { status: 500 }
    );
  }
}
