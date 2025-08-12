import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'USER') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's assigned admin as emergency contact
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: {
        assignedAdmin: true
      }
    });

    const emergencyContacts = [];

    if (user?.assignedAdmin) {
      emergencyContacts.push({
        id: user.assignedAdmin.id,
        name: user.assignedAdmin.username,
        role: 'Project Administrator',
        phone: '+1-555-0123', // Mock phone number
        isAvailable: true
      });
    }

    // Add mock emergency services contact
    emergencyContacts.push({
      id: 'emergency-services',
      name: 'Emergency Services',
      role: 'Emergency Response',
      phone: '911',
      isAvailable: true
    });

    return NextResponse.json({
      data: emergencyContacts
    });

  } catch (error) {
    console.error('Emergency contacts fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch emergency contacts' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}