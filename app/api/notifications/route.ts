import { NextResponse } from 'next/server';
import { pusherServer, getUserChannel, EVENT_TYPES } from '@/lib/pusher';
import prisma from '@/lib/db';

// POST /api/notifications - Create and send a notification
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, title, message, type } = body;
    
    if (!userId || !title || !message || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Create notification in database
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        isRead: false
      }
    });
    
    // Trigger Pusher event using standardized channel naming
    await pusherServer.trigger(getUserChannel(userId), EVENT_TYPES.NEW_NOTIFICATION, {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      createdAt: notification.createdAt,
      isRead: notification.isRead
    });
    
    return NextResponse.json(notification);
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/notifications?userId=xyz - Get all notifications for a user
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // First try to find notifications using the provided ID directly
    let notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    
    // If no notifications found and the ID looks like a Clerk ID (starts with "user_")
    if (notifications.length === 0 && userId.startsWith('user_')) {
            
      // Look up the internal user ID from the clerk ID
      const user = await prisma.user.findFirst({
        where: { clerkId: userId }
      });
      
      if (user) {
                
        // Get notifications for the internal user ID
        notifications = await prisma.notification.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' }
        });
        
              }
    }
    
    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 