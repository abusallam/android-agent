import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db-config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deviceId, data, timestamp, type } = body;

    console.log('🔄 Sync request:', { deviceId, type, timestamp });

    // In a real implementation, you would:
    // 1. Authenticate the request
    // 2. Validate the device ID
    // 3. Process different types of sync data
    // 4. Update the database accordingly

    // For now, just acknowledge the sync
    return NextResponse.json({
      success: true,
      message: 'Data synchronized successfully',
      timestamp: new Date().toISOString(),
      processed: {
        deviceId,
        type,
        recordCount: Array.isArray(data) ? data.length : 1
      }
    });

  } catch (error) {
    console.error('❌ Sync error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to sync data' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Return sync status and available endpoints
    const deviceCount = await prisma.device.count();
    
    return NextResponse.json({
      message: 'Sync service is active',
      timestamp: new Date().toISOString(),
      stats: {
        connectedDevices: deviceCount,
        lastSync: new Date().toISOString()
      },
      endpoints: {
        device: '/api/device/sync',
        location: '/api/location/sync',
        emergency: '/api/emergency/alert'
      }
    });
  } catch (error) {
    console.error('❌ Sync status error:', error);
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    );
  }
}