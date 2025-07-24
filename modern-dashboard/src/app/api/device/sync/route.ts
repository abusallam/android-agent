import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const deviceData = await request.json();
    
    // Extract device ID from user agent or generate one
    const deviceId = generateDeviceId(deviceData.userAgent);
    
    // Update or create device record
    const device = await prisma.device.upsert({
      where: { deviceId },
      update: {
        isOnline: true,
        lastSeen: new Date(),
        ipAddress: getClientIP(request),
      },
      create: {
        deviceId,
        name: `Device ${deviceId.slice(-6)}`,
        isOnline: true,
        firstSeen: new Date(),
        lastSeen: new Date(),
        ipAddress: getClientIP(request),
      }
    });

    // Log device information
    await prisma.log.create({
      data: {
        level: 'INFO',
        message: `Device sync: ${deviceId}`,
        userId: session.id,
        metadata: deviceData
      }
    });

    return NextResponse.json({
      success: true,
      deviceId: device.deviceId
    });
  } catch (error) {
    console.error('Device sync error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateDeviceId(userAgent: string): string {
  // Generate a consistent device ID based on user agent
  const crypto = require('crypto');
  return crypto.createHash('md5').update(userAgent).digest('hex').slice(0, 16);
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}