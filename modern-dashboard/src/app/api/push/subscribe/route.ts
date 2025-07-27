import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for demo (use database in production)
const subscriptions: Array<{
  endpoint: string;
  keys: { p256dh: string; auth: string };
  timestamp: string;
}> = [];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint, keys, action } = body;

    if (action === 'subscribe') {
      // Store subscription
      const subscription = { endpoint, keys, timestamp: new Date().toISOString() };
      subscriptions.push(subscription);
      
      console.log('📱 Push subscription registered:', { endpoint: endpoint?.substring(0, 50) + '...' });

      return NextResponse.json({
        success: true,
        message: 'Push subscription registered successfully'
      });
    }

    if (action === 'send-emergency') {
      const { message, location } = body;
      
      console.log(`🚨 Emergency alert: ${message}`);
      console.log(`📍 Location: ${location?.address || 'Unknown'}`);
      
      // In a real implementation, you would send actual push notifications here
      // For demo purposes, we'll just log and return success
      
      return NextResponse.json({
        success: true,
        message: `Emergency alert logged: ${message}`,
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'send-notification') {
      const { title, message } = body;
      
      console.log(`🔔 Notification: ${title} - ${message}`);
      
      return NextResponse.json({
        success: true,
        message: 'Notification sent successfully',
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('❌ Push notification error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process push notification request' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Push notification endpoint is active',
    subscriptions: subscriptions.length,
    timestamp: new Date().toISOString()
  });
}