import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession, hashPassword } from '@/lib/auth';

const prisma = new PrismaClient();

// Update user (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'ROOT_ADMIN' && session.role !== 'ADMIN')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { username, email, role, isActive, password } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get existing user
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Only ROOT_ADMIN can modify ROOT_ADMIN users
    if (existingUser.role === 'ROOT_ADMIN' && session.role !== 'ROOT_ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Only ROOT_ADMIN can modify ROOT_ADMIN users' },
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    if (username) updateData.username = username;
    if (email !== undefined) updateData.email = email;
    if (role && (session.role === 'ROOT_ADMIN' || role !== 'ROOT_ADMIN')) {
      updateData.role = role;
    }
    if (isActive !== undefined) updateData.isActive = isActive;
    if (password) {
      updateData.password = await hashPassword(password);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully'
    });

  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update user' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Delete user (ROOT_ADMIN only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ROOT_ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - ROOT_ADMIN access required' },
        { status: 403 }
      );
    }

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get existing user
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent deleting ROOT_ADMIN users
    if (existingUser.role === 'ROOT_ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Cannot delete ROOT_ADMIN users' },
        { status: 403 }
      );
    }

    // Prevent self-deletion
    if (existingUser.id === session.id) {
      return NextResponse.json(
        { success: false, message: 'Cannot delete your own account' },
        { status: 403 }
      );
    }

    // Delete user (this will cascade delete sessions due to foreign key)
    await prisma.user.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete user' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Get single user (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'ROOT_ADMIN' && session.role !== 'ADMIN')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { id } = params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        createdBy: true,
        _count: {
          select: {
            sessions: true
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

    return NextResponse.json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch user' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}