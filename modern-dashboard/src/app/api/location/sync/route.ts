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

    const locationData = await request.json();
    const { latitude, longitude, accuracy, timestamp } = locationData;
    
    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }

    // Get or create device
    const deviceId = generateDeviceId(request.headers.get('user-agent') || '');
    
    const device = await prisma.device.upsert({
      where: { deviceId },
      update: {
        isOnline: true,
        lastSeen: new Date(),
        location: {
          latitude,
          longitude,
          accuracy,
          timestamp
        }
      },
      create: {
        deviceId,
        name: `Device ${deviceId.slice(-6)}`,
        isOnline: true,
        firstSeen: new Date(),
        lastSeen: new Date(),
        location: {
          latitude,
          longitude,
          accuracy,
          timestamp
        }
      }
    });

    // Store GPS log
    await prisma.gpsLog.create({
      data: {
        deviceId: device.id,
        latitude,
        longitude,
        accuracy: accuracy || 0,
        enabled: true,
        timestamp: new Date(timestamp)
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Location synced successfully'
    });
  } catch (error) {
    console.error('Location sync error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateDeviceId(userAgent: string): string {
  const crypto = require('crypto');
  return crypto.createHash('md5').update(userAgent).digest('hex').slice(0, 16);
}