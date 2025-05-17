import { NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { channel, event, data } = body;
    
    if (!channel || !event) {
      return NextResponse.json(
        { error: 'Channel and event are required' },
        { status: 400 }
      );
    }
    
    // Trigger a Pusher event
    await pusherServer.trigger(
      channel,
      event,
      data || { message: 'Test message from server' }
    );
    
    return NextResponse.json({
      success: true,
      message: `Event triggered on channel ${channel}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error triggering Pusher event:', error);
    return NextResponse.json(
      { error: 'Failed to trigger Pusher event', details: error },
      { status: 500 }
    );
  }
} 