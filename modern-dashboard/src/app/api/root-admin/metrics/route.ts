import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ROOT_ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get system metrics
    const totalProjectAdmins = await prisma.user.count({
      where: { role: 'PROJECT_ADMIN' }
    });

    const totalUsers = await prisma.user.count({
      where: { role: 'USER' }
    });

    const totalProjects = await prisma.project.count();
    const totalDevices = await prisma.device.count();
    const onlineDevices = await prisma.device.count({
      where: { isOnline: true }
    });

    // Mock resource usage data
    const resourceUsage = {
      cpu: Math.floor(Math.random() * 30) + 40, // 40-70%
      memory: Math.floor(Math.random() * 40) + 50, // 50-90%
      storage: Math.floor(Math.random() * 20) + 30 // 30-50%
    };

    return NextResponse.json({
      totalProjectAdmins,
      totalUsers,
      totalProjects,
      totalDevices,
      onlineDevices,
      systemHealth: 'healthy',
      resourceUsage
    });

  } catch (error) {
    console.error('Root admin metrics error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch metrics' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}