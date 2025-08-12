import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession, hashPassword } from '@/lib/auth';

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

    // Get all project admins with their project info
    const projectAdmins = await prisma.user.findMany({
      where: { role: 'PROJECT_ADMIN' },
      include: {
        managedProject: true,
        assignedUsers: true
      }
    });

    const formattedAdmins = projectAdmins.map(admin => ({
      id: admin.id,
      username: admin.username,
      email: admin.email,
      projectName: admin.managedProject?.[0]?.name || 'No Project',
      userCount: admin.assignedUsers.length,
      isActive: admin.isActive,
      lastLogin: admin.lastLogin?.toISOString() || 'Never'
    }));

    return NextResponse.json(formattedAdmins);

  } catch (error) {
    console.error('Project admins fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch project admins' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ROOT_ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { username, email, projectName } = body;

    if (!username || !email || !projectName) {
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

    // Create project admin with default password
    const defaultPassword = 'admin123';
    const hashedPassword = await hashPassword(defaultPassword);

    const newAdmin = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role: 'PROJECT_ADMIN',
        isActive: true,
        createdBy: session.id
      }
    });

    // Create associated project
    const project = await prisma.project.create({
      data: {
        name: projectName,
        description: `Project managed by ${username}`,
        adminId: newAdmin.id,
        userCount: 0
      }
    });

    // Update admin with project reference
    await prisma.user.update({
      where: { id: newAdmin.id },
      data: { projectId: project.id }
    });

    return NextResponse.json({
      success: true,
      message: 'Project admin created successfully',
      admin: {
        id: newAdmin.id,
        username: newAdmin.username,
        email: newAdmin.email,
        projectName: project.name
      }
    });

  } catch (error) {
    console.error('Create project admin error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create project admin' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}