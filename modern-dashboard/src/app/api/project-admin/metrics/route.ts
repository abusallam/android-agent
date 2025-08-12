import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'PROJECT_ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get project admin's assigned users
    const assignedUsers = await prisma.user.findMany({
      where: { assignedAdminId: session.id },
      include: {
        userAssignments: true
      }
    });

    const totalAssignedUsers = assignedUsers.length;
    const activeUsers = assignedUsers.filter(user => user.isActive).length;

    // Get devices for assigned users
    const totalDevices = await prisma.device.count();
    const onlineDevices = await prisma.device.count({
      where: { isOnline: true }
    });

    // Get emergency alerts count (mock data)
    const emergencyAlerts = 0;

    // Get project name
    const adminUser = await prisma.user.findUnique({
      where: { id: session.id },
      include: { managedProject: true }
    });

    const projectName = adminUser?.managedProject?.[0]?.name || 'Unknown Project';

    return NextResponse.json({
      data: {
        totalAssignedUsers,
        activeUsers,
        onlineDevices,
        totalDevices,
        emergencyAlerts,
        projectName
      }
    });

  } catch (error) {
    console.error('Project admin metrics error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch metrics' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}