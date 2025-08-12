import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      deviceInfo, 
      location, 
      batteryInfo, 
      networkInfo, 
      sensorData,
      timestamp,
      source 
    } = body;

    console.log('📱 Comprehensive Device Sync:', {
      timestamp,
      source,
      deviceId: deviceInfo?.deviceId,
      hasLocation: !!location,
      hasBattery: !!batteryInfo,
      hasNetwork: !!networkInfo,
      hasSensors: !!sensorData
    });

    if (!deviceInfo?.deviceId) {
      return NextResponse.json(
        { success: false, message: 'Device ID is required' },
        { status: 400 }
      );
    }

    // Find or create device
    let device = await prisma.device.findUnique({
      where: { deviceId: deviceInfo.deviceId }
    });

    if (!device) {
      // Create device if it doesn't exist
      device = await prisma.device.create({
        data: {
          deviceId: deviceInfo.deviceId,
          name: deviceInfo.model || 'Unknown Device',
          model: deviceInfo.model,
          manufacturer: deviceInfo.manufacturer,
          version: deviceInfo.osVersion,
          isOnline: true,
          lastSeen: new Date(),
          firstSeen: new Date()
        }
      });
      console.log('✅ New device registered:', device.name);
    } else {
      // Update device status
      await prisma.device.update({
        where: { id: device.id },
        data: {
          isOnline: true,
          lastSeen: new Date(),
          ipAddress: networkInfo?.ipAddress
        }
      });
      console.log('✅ Device status updated:', device.name);
    }

    // Store location data if provided
    if (location && location.latitude && location.longitude) {
      await prisma.gpsLog.create({
        data: {
          deviceId: device.id,
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          timestamp: new Date(timestamp || Date.now())
        }
      });

      // Update device location
      await prisma.device.update({
        where: { id: device.id },
        data: {
          location: JSON.stringify({
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
            timestamp: timestamp || new Date().toISOString()
          })
        }
      });
      console.log('📍 Location updated:', `${location.latitude}, ${location.longitude}`);
    }

    // Store sensor data if provided
    if (sensorData && Object.keys(sensorData).length > 0) {
      // Store different sensor types
      for (const [sensorType, data] of Object.entries(sensorData)) {
        if (data && sensorType !== 'timestamp') {
          await prisma.sensorData.create({
            data: {
              deviceId: device.id,
              sensorType,
              data: JSON.stringify(data),
              timestamp: new Date(sensorData.timestamp || Date.now())
            }
          });
        }
      }
      console.log('🔬 Sensor data stored:', Object.keys(sensorData).filter(k => k !== 'timestamp'));
    }

    return NextResponse.json({
      success: true,
      message: 'Device data synchronized successfully',
      timestamp: new Date().toISOString(),
      device: {
        id: device.id,
        name: device.name,
        isOnline: device.isOnline
      },
      commands: [] // Any pending commands for the device
    });

  } catch (error) {
    console.error('❌ Device sync error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to sync device status' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Device sync endpoint is active',
    timestamp: new Date().toISOString()
  });
}