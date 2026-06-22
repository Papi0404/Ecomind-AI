import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    // Admin Guard
    if (!user || user.role !== 'ADMIN') {
      return new NextResponse('Not Found', { status: 404 });
    }

    // Run parallel queries to compile stats
    const [
      totalUsers,
      totalPoints,
      completedChallenges,
      totalUploads,
      totalUploadsSize,
      totalReports,
      recentLogs,
      recentReports
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.aggregate({ _sum: { ecoPoints: true } }),
      prisma.userChallenge.count({ where: { status: 'COMPLETED' } }),
      prisma.upload.count(),
      prisma.upload.aggregate({ _sum: { sizeBytes: true } }),
      prisma.report.count(),
      prisma.adminLog.findMany({
        take: 15,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } } }
      }),
      prisma.report.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } } }
      })
    ]);

    return NextResponse.json({
      stats: {
        totalUsers,
        totalPoints: totalPoints._sum.ecoPoints || 0,
        completedChallenges,
        totalUploads,
        totalUploadsSize: totalUploadsSize._sum.sizeBytes || 0,
        totalReports,
      },
      recentLogs,
      recentReports,
    });
  } catch (error) {
    console.error('Admin Stats API Error:', error);
    return NextResponse.json(
      { message: 'Terjadi kesalahan pada server.' },
      { status: 500 }
    );
  }
}
