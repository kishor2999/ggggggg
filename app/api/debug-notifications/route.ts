import { NextResponse } from 'next/server';
import { pusherServer, getUserChannel, EVENT_TYPES } from '@/lib/pusher';
import prisma from '@/lib/db';

// GET /api/debug-notifications?userId=xyz - Test notifications for a specific user
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const clerkUserId = searchParams.get('userId');
    
    if (!clerkUserId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // First check if this user exists in our database
    const user = await prisma.user.findFirst({
      where: {
        clerkId: clerkUserId
      }
    });
    
    if (!user) {
      console.log(`User with clerkId ${clerkUserId} not found in database. Creating mock notification.`);
      
      // Since user doesn't exist in the database, we can't create a notification record,
      // but we can still send a Pusher event for testing purposes
      const mockNotification = {
        id: 'mock-notification-' + Date.now(),
        title: 'Test Notification',
        message: 'This is a mock notification for testing purposes. Note: Your Clerk user ID is not linked to a database user.',
        type: 'TEST',
        createdAt: new Date(),
        isRead: false
      };
      
      // Trigger Pusher event without creating a database record
      await pusherServer.trigger(getUserChannel(clerkUserId), EVENT_TYPES.NEW_NOTIFICATION, mockNotification);
      
      console.log(`Triggered mock Pusher notification event to channel: ${getUserChannel(clerkUserId)}`);
      
      return NextResponse.json({
        success: true,
        message: 'Mock notification sent (user not found in database)',
        note: 'This notification only exists in Pusher, not in the database',
        userId: clerkUserId,
        mockNotification
      });
    }
    
    console.log(`Found user with internal ID ${user.id} for clerkId ${clerkUserId}`);
    
    // Create a real notification in database using the internal userId
    const notification = await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Test Notification',
        message: 'This is a test notification to debug the notification system.',
        type: 'TEST',
        isRead: false
      }
    });
    
    console.log(`Created test notification with ID: ${notification.id} for user: ${user.id}`);
    
    // Trigger Pusher event
    await pusherServer.trigger(getUserChannel(clerkUserId), EVENT_TYPES.NEW_NOTIFICATION, {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      createdAt: notification.createdAt,
      isRead: false
    });
    
    console.log(`Triggered Pusher notification event to channel: ${getUserChannel(clerkUserId)}`);
    
    return NextResponse.json({
      success: true,
      message: 'Test notification sent',
      dbUserId: user.id,
      clerkUserId: clerkUserId,
      notification
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, title, message, type = "DEBUG" } = body;
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // Find or create user in the database
    const user = await prisma.user.findFirst({
      where: {
        clerkId: userId,
      },
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    console.log(`Creating debug notification for user ${user.id} (Clerk ID: ${user.clerkId})`);
    
    // Create notification in database
    const notification = await prisma.notification.create({
      data: {
        userId: user.id,
        title: title || 'Debug Notification',
        message: message || 'This is a debug notification',
        type: type,
        isRead: false
      }
    });
    
    console.log(`Notification created:`, notification);
    
    // Create the mock notification object early so it can be used anywhere
    const mockNotification = {
      id: `mock-notification-${Date.now()}`,
      title: `${title} (Mock)` || 'Mock Notification',
      message: `${message} (Mock)` || 'This is a mock notification that bypasses the database',
      type: type,
      createdAt: new Date(),
      isRead: false
    };
    
    // Send to all possible user channels to ensure delivery
    console.log(`Sending to ${getUserChannel(user.id)} channel`);
    await pusherServer.trigger(getUserChannel(user.id), EVENT_TYPES.NEW_NOTIFICATION, {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      createdAt: notification.createdAt,
      isRead: notification.isRead
    });
    
    if (user.clerkId) {
      console.log(`Sending to ${getUserChannel(user.clerkId)} channel`);
      await pusherServer.trigger(getUserChannel(user.clerkId), EVENT_TYPES.NEW_NOTIFICATION, {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        createdAt: notification.createdAt,
        isRead: notification.isRead
      });
      
      // Only send mock notification if clerkId exists
      console.log(`Sending mock notification to ${getUserChannel(user.clerkId)} channel`);
      await pusherServer.trigger(getUserChannel(user.clerkId), EVENT_TYPES.NEW_NOTIFICATION, mockNotification);
    }
    
    // Also try the DB-specific channel
    console.log(`Sending to user-db-${user.clerkId || user.id} channel`);
    await pusherServer.trigger(`user-db-${user.clerkId || user.id}`, EVENT_TYPES.NEW_NOTIFICATION, {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      createdAt: notification.createdAt,
      isRead: notification.isRead
    });
    
    return NextResponse.json({ 
      success: true, 
      notification,
      mockNotification,
      channels: [
        getUserChannel(user.id), 
        user.clerkId ? getUserChannel(user.clerkId) : null,
        `user-db-${user.clerkId || user.id}`
      ].filter(Boolean) 
    });
  } catch (error) {
    console.error('Error creating debug notification:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
} 