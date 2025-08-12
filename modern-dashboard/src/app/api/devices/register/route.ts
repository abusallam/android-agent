import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      deviceId, 
      model, 
      manufacturer, 
      osVersion, 
      platform, 
      appVersion,
      name 
    } = body;

    if (!deviceId) {
      return NextResponse.json(
        { success: false, message: 'Device ID is required' },
        { status: 400 }
      );
    }

    // Check if device already exists
    let device = await prisma.device.findUnique({
      where: { deviceId }
    });

    if (device) {
      // Update existing device
      device = await prisma.device.update({
        where: { deviceId },
        data: {
          model,
          manufacturer,
          version: osVersion,
          name: name || device.name,
          isOnline: true,
          lastSeen: new Date(),
          updatedAt: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Device updated successfully',
        device: {
          id: device.id,
          deviceId: device.deviceId,
          name: device.name,
          model: device.model,
          manufacturer: device.manufacturer,
          isOnline: device.isOnline
        }
      });
    } else {
      // Create new device
      device = await prisma.device.create({
        data: {
          deviceId,
          name: name || `${manufacturer} ${model}`,
          model,
          manufacturer,
          version: osVersion,
          isOnline: true,
          lastSeen: new Date(),
          firstSeen: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Device registered successfully',
        device: {
          id: device.id,
          deviceId: device.deviceId,
          name: device.name,
          model: device.model,
          manufacturer: device.manufacturer,
          isOnline: device.isOnline
        }
      });
    }

  } catch (error) {
    console.error('Device registration error:', error);
    return NextResponse.json(
      { success: false, message: 'Device registration failed' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Device registration endpoint - POST to register a device',
    requiredFields: [
      'deviceId',
      'model',
      'manufacturer', 
      'osVersion',
      'platform',
      'appVersion'
    ],
    optionalFields: [
      'name'
    ]
  });
}