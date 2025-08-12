import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession, hashPassword } from '@/lib/auth';

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

    // Get assigned users with their device status
    const assignedUsers = await prisma.user.findMany({
      where: { assignedAdminId: session.id },
      include: {
        userAssignments: true
      }
    });

    // Mock device status for each user
    const formattedUsers = assignedUsers.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      isActive: user.isActive,
      lastSeen: user.lastLogin?.toISOString() || 'Never',
      deviceStatus: {
        isOnline: Math.random() > 0.3, // 70% chance online
        deviceName: `${user.username}'s Device`,
        location: Math.random() > 0.5 ? {
          latitude: 40.7128 + (Math.random() - 0.5) * 0.1,
          longitude: -74.0060 + (Math.random() - 0.5) * 0.1
        } : undefined
      },
      permissions: {
        canReceiveCalls: true,
        canShareLocation: true,
        canTriggerEmergency: true
      }
    }));

    return NextResponse.json({
      data: formattedUsers
    });

  } catch (error) {
    console.error('Project admin users fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch users' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'PROJECT_ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { username, email, password } = body;

    if (!username || !email || !password) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Username already exists' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);

    // Get admin's project
    const adminUser = await prisma.user.findUnique({
      where: { id: session.id },
      include: { managedProject: true }
    });

    const projectId = adminUser?.managedProject?.[0]?.id;

    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role: 'USER',
        isActive: true,
        assignedAdminId: session.id,
        projectId,
        createdBy: session.id
      }
    });

    // Create user assignment
    await prisma.userAssignment.create({
      data: {
        projectAdminId: session.id,
        userId: newUser.id,
        permissions: JSON.stringify({
          canReceiveCalls: true,
          canShareLocation: true,
          canTriggerEmergency: true,
          monitoringLevel: 'full'
        })
      }
    });

    // Update project user count
    if (projectId) {
      await prisma.project.update({
        where: { id: projectId },
        data: {
          userCount: {
            increment: 1
          }
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email
      }
    });

  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create user' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}