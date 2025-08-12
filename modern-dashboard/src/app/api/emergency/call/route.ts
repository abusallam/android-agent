import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { contactType, timestamp, location } = body;

    // Log the emergency call attempt
    console.log(`🚨 EMERGENCY CALL INITIATED:`, {
      contactType,
      timestamp,
      location,
      user: session.user.username
    });

    // In a real implementation, this would:
    // 1. Integrate with a calling service (Twilio, etc.)
    // 2. Call the actual phone numbers
    // 3. Send SMS with location
    // 4. Log to database

    // Simulate call delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock phone numbers for demonstration
    const phoneNumbers = {
      primary: '+1-555-0123',
      secondary: '+1-555-0456', 
      '911': '911'
    };

    return NextResponse.json({
      success: true,
      message: `Emergency call initiated to ${contactType}`,
      data: {
        contactType,
        phoneNumber: phoneNumbers[contactType as keyof typeof phoneNumbers],
        timestamp,
        location,
        callId: `emergency-${Date.now()}`,
        status: 'calling'
      }
    });

  } catch (error) {
    console.error('Emergency call API error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to initiate emergency call' },
      { status: 500 }
    );
  }
}