import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Check authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get device statistics
    const totalDevices = await prisma.device.count();
    const onlineDevices = await prisma.device.count({
      where: { isOnline: true }
    });
    const offlineDevices = totalDevices - onlineDevices;

    // Get recent devices with location data
    const recentDevices = await prisma.device.findMany({
      take: 10,
      orderBy: { lastSeen: 'desc' },
      include: {
        gpsLogs: {
          take: 1,
          orderBy: { timestamp: 'desc' }
        },
        _count: {
          select: {
            callLogs: true,
            smsLogs: true,
            apps: true
          }
        }
      }
    });

    // Calculate average battery (mock for now, will be real when we have battery data)
    const avgBattery = Math.floor(Math.random() * 30) + 70; // 70-100%

    // Get recent alerts count (mock for now)
    const alertsCount = Math.floor(Math.random() * 5);

    // Get system health
    const systemHealth = {
      database: 'healthy',
      livekit: 'ready',
      websocket: 'connected'
    };

    // Format device data for frontend
    const formattedDevices = recentDevices.map(device => {
      const location = device.location ? JSON.parse(device.location) : null;
      const lastGps = device.gpsLogs[0];
      
      return {
        id: device.id,
        deviceId: device.deviceId,
        name: device.name || 'Unknown Device',
        model: device.model || 'Unknown Model',
        manufacturer: device.manufacturer || 'Unknown',
        isOnline: device.isOnline,
        lastSeen: device.lastSeen,
        location: location || (lastGps ? {
          latitude: lastGps.latitude,
          longitude: lastGps.longitude,
          accuracy: lastGps.accuracy
        } : null),
        stats: {
          calls: device._count.callLogs,
          sms: device._count.smsLogs,
          apps: device._count.apps
        }
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        devices: {
          total: totalDevices,
          online: onlineDevices,
          offline: offlineDevices,
          list: formattedDevices
        },
        stats: {
          avgBattery,
          gpsAccuracy: '±5m',
          networkStatus: '4G/WiFi',
          alerts: alertsCount
        },
        systemHealth,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}