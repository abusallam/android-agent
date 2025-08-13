import { NextRequest, NextResponse } from 'next/server';
import { EnhancedAuth, SECURITY_TIERS, SecurityTier } from '@/lib/enhanced-auth';
import { setAuthCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, securityTier, mfaCode } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Determine security tier
    const tier = (securityTier as SecurityTier) || SECURITY_TIERS.CIVILIAN;

    // Authenticate user with enhanced security
    const authResult = await EnhancedAuth.authenticateUser(
      username, 
      password, 
      tier, 
      mfaCode
    );

    if (!authResult) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials or MFA code required' },
        { status: 401 }
      );
    }

    // Set auth cookie for web sessions
    await setAuthCookie(authResult.accessToken);

    return NextResponse.json({
      success: true,
      user: {
        id: authResult.user.id,
        username: authResult.user.username,
        email: authResult.user.email,
        role: authResult.user.role,
        securityTier: authResult.user.securityTier,
        permissions: authResult.user.permissions,
        mfaEnabled: authResult.user.mfaEnabled
      },
      token: authResult.accessToken,
      refreshToken: authResult.refreshToken,
      expiresAt: authResult.expiresAt
    });

  } catch (error) {
    console.error('Enhanced login error:', error);
    return NextResponse.json(
      { success: false, message: 'Authentication failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Authentication endpoint - POST to login'
  });
}