import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'USER') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Mock device status data
    const deviceStatus = {
      isOnline: true,
      deviceName: `${session.username}'s Device`,
      model: 'Android Device',
      batteryLevel: Math.floor(Math.random() * 40) + 60, // 60-100%
      networkType: Math.random() > 0.5 ? 'WiFi' : '4G',
      signalStrength: Math.floor(Math.random() * 30) + 70, // 70-100%
      location: {
        latitude: 40.7128 + (Math.random() - 0.5) * 0.01,
        longitude: -74.0060 + (Math.random() - 0.5) * 0.01,
        accuracy: Math.floor(Math.random() * 10) + 5 // 5-15m
      },
      lastSync: new Date().toISOString()
    };

    return NextResponse.json({
      data: deviceStatus
    });

  } catch (error) {
    console.error('Device status fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch device status' },
      { status: 500 }
    );
  }
}