/**
 * LiveKit Token Generation API
 * Generates secure access tokens for LiveKit streaming sessions
 */

import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import { getLiveKitConfig, getTokenOptions } from '@/lib/livekit-config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deviceId, roomName, isAdmin = false, sessionType = 'monitoring' } = body;

    // Validate required parameters
    if (!deviceId || !roomName) {
      return NextResponse.json(
        { error: 'Missing required parameters: deviceId and roomName' },
        { status: 400 }
      );
    }

    // Get LiveKit configuration
    const config = getLiveKitConfig();
    
    if (!config.apiKey || !config.apiSecret) {
      console.error('LiveKit API credentials not configured');
      return NextResponse.json(
        { error: 'LiveKit service not configured' },
        { status: 500 }
      );
    }

    // Get token options
    const tokenOptions = getTokenOptions(deviceId, isAdmin);

    // Create access token
    const token = new AccessToken(config.apiKey, config.apiSecret, tokenOptions);

    // Set room permissions based on role
    if (isAdmin) {
      // Admin permissions - full control
      token.addGrant({
        room: roomName,
        roomJoin: true,
        roomList: true,
        roomRecord: true,
        roomAdmin: true,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
        canUpdateOwnMetadata: true,
      });
    } else {
      // Device permissions - limited control
      token.addGrant({
        room: roomName,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
        canUpdateOwnMetadata: true,
      });
    }

    // Generate JWT token
    const jwt = await token.toJwt();

    // Return token and session info
    return NextResponse.json({
      token: jwt,
      serverUrl: config.serverUrl,
      roomName,
      identity: tokenOptions.identity,
      sessionInfo: {
        deviceId,
        isAdmin,
        sessionType,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

  } catch (error) {
    console.error('Error generating LiveKit token:', error);
    return NextResponse.json(
      { error: 'Failed to generate access token' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Health check for LiveKit token service
  const config = getLiveKitConfig();
  
  return NextResponse.json({
    status: 'healthy',
    service: 'livekit-token-generator',
    configured: !!(config.apiKey && config.apiSecret && config.serverUrl),
    serverUrl: config.serverUrl,
    timestamp: new Date().toISOString(),
  });
}