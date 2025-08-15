import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Fallback admin credentials (temporary solution)
const FALLBACK_ADMIN = {
  id: 'admin-fallback-001',
  username: 'admin',
  email: 'admin@tacticalops.local',
  role: 'ADMIN',
  // Pre-hashed password for 'admin123'
  passwordHash: '$2b$12$b.Cgo9WAdz4QA0Ve7Lu81.SEYBrRC.MMgFFjIRAUINR16GDDveZJK'
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    console.log('🔐 Simple login attempt:', { username });

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'Username and password are required' },
        { status: 400 }
      );
    }

    let user = null;
    let passwordValid = false;

    try {
      // Try database authentication first
      user = await prisma.user.findUnique({
        where: { username }
      });

      if (user) {
        passwordValid = await bcrypt.compare(password, user.password);
        console.log('✅ Database authentication attempted');
      }
    } catch (dbError) {
      console.log('⚠️ Database unavailable, using fallback authentication');
      
      // Fallback authentication for admin user
      if (username === FALLBACK_ADMIN.username) {
        passwordValid = await bcrypt.compare(password, FALLBACK_ADMIN.passwordHash);
        if (passwordValid) {
          user = {
            id: FALLBACK_ADMIN.id,
            username: FALLBACK_ADMIN.username,
            email: FALLBACK_ADMIN.email,
            role: FALLBACK_ADMIN.role
          };
          console.log('✅ Fallback authentication successful');
        }
      }
    }

    if (!user || !passwordValid) {
      console.log('❌ Authentication failed for user:', username);
      return NextResponse.json(
        { success: false, message: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role
      },
      process.env.JWT_SECRET || 'tactical-ops-secret',
      { expiresIn: '24h' }
    );

    console.log('✅ Login successful for user:', username);

    // Set HTTP-only cookie for web sessions
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24 hours
    });

    return response;

  } catch (error) {
    console.error('❌ Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Authentication failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Simple authentication endpoint - POST to login'
  });
}