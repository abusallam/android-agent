import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

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

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      console.log('❌ User not found:', username);
      return NextResponse.json(
        { success: false, message: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      console.log('❌ Invalid password for user:', username);
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

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token
    });

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