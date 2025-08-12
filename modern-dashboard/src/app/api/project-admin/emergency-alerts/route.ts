import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'PROJECT_ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Mock emergency alerts data
    const mockAlerts = [
      {
        id: '1',
        userId: 'user1',
        username: 'user1',
        type: 'panic',
        message: 'Emergency assistance requested',
        timestamp: new Date().toISOString(),
        status: 'active'
      }
    ];

    return NextResponse.json({
      data: mockAlerts
    });

  } catch (error) {
    console.error('Emergency alerts fetch error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch emergency alerts' },
      { status: 500 }
    );
  }
}