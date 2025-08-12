import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'USER') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user profile with assigned admin info
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: {
        assignedAdmin: {
          include: {
            managedProject: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const userProfile = {
      id: user.id,
      username: user.username,
      email: user.email,
      assignedAdmin: {
        username: user.assignedAdmin?.username || 'Unknown',
        projectName: user.assignedAdmin?.managedProject?.[0]?.name || 'Unknown Project'
      },
      personalMetrics: {
        tasksCompleted: Math.floor(Math.random() * 50) + 10,
        hoursActive: Math.floor(Math.random() * 8) + 1,
        lastActivity: new Date().toISOString()
      }
    };

    return NextResponse.json({
      data: userProfile
    });

  } catch (error) {
    console.error('User profile fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch user profile' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}