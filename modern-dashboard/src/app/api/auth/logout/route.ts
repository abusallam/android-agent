import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession, clearAuthCookie } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Get current session
    const session = await getSession();
    
    if (session) {
      // Delete session from database
      await prisma.session.deleteMany({
        where: { userId: session.id }
      });
    }

    // Clear auth cookie
    await clearAuthCookie();

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, message: 'Logout failed' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Logout endpoint - POST to logout'
  });
}