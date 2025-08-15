import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Fallback admin user (same as in simple-login)
const FALLBACK_ADMIN = {
  id: 'admin-fallback-001',
  username: 'admin',
  email: 'admin@tacticalops.local',
  role: 'ADMIN'
};

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header or cookies
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'No token provided' },
        { status: 401 }
      );
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tactical-ops-secret') as any;

    let user = null;

    try {
      // Try to get user from database first
      user = await prisma.user.findUnique({
        where: { id: decoded.userId }
      });
      console.log('✅ Database user lookup attempted');
    } catch (dbError) {
      console.log('⚠️ Database unavailable, using fallback user data');
      
      // Use fallback user data if database is unavailable
      if (decoded.userId === FALLBACK_ADMIN.id && decoded.username === FALLBACK_ADMIN.username) {
        user = FALLBACK_ADMIN;
        console.log('✅ Fallback user data used');
      }
    }

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('❌ Auth check error:', error);
    return NextResponse.json(
      { success: false, message: 'Invalid token' },
      { status: 401 }
    );
  }
}