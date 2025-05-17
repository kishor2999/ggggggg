import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { pusherServer, getUserChannel, EVENT_TYPES } from '@/lib/pusher';

// PUT /api/notifications/mark-all-read?userId=xyz - Mark all notifications as read for a user
export async function PUT(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      console.error('Mark all as read: User ID is missing');
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    (`Marking all notifications as read for user ${userId}`);
    
    // Determine the correct user ID to use (handle Clerk ID translation)
    let internalUserId = userId;
    
    // If the ID looks like a Clerk ID (starts with "user_")
    if (userId.startsWith('user_')) {
      (`Clerk ID detected: ${userId}. Looking up internal user ID...`);
      
      // Look up the internal user ID from the clerk ID
      const user = await prisma.user.findFirst({
        where: { clerkId: userId }
      });
      
      if (user) {
        internalUserId = user.id;
        (`Found internal user ID ${internalUserId} for Clerk ID ${userId}`);
      } else {
        (`No user found with Clerk ID ${userId}`);
      }
    }
    
    // Check if there are any unread notifications first
    const unreadCount = await prisma.notification.count({
      where: {
        userId: internalUserId,
        isRead: false
      }
    });
    
    (`Found ${unreadCount} unread notifications for internal user ID ${internalUserId}`);
    
    if (unreadCount === 0) {
      ('No unread notifications found, nothing to update');
      return NextResponse.json({
        success: true,
        count: 0,
        message: 'No unread notifications to mark as read'
      });
    }
    
    // Update all unread notifications for the user
    const result = await prisma.notification.updateMany({
      where: { 
        userId: internalUserId,
        isRead: false
      },
      data: { 
        isRead: true 
      }
    });
    
    (`Updated ${result.count} notifications to read status`);
    
    // Trigger a Pusher event to notify other components about the status change
    if (result.count > 0) {
      (`Sending Pusher events to ${getUserChannel(userId)} and user-db-${userId}`);
      
      // Define the event payload
      const eventPayload = {
        action: 'mark-all-read',
        userId: userId, // Use original userId for Pusher to match client subscription
        internalUserId: internalUserId,
        count: result.count,
        timestamp: new Date().toISOString()
      };
      
      try {
        // Send to primary user channel
        await pusherServer.trigger(
          getUserChannel(userId), 
          EVENT_TYPES.NOTIFICATION_STATUS_UPDATED, 
          eventPayload
        );
        
        // Also send to the DB-specific channel for compatibility
        await pusherServer.trigger(
          `user-db-${userId}`, 
          EVENT_TYPES.NOTIFICATION_STATUS_UPDATED, 
          eventPayload
        );
        
        ('Pusher events sent successfully');
      } catch (pusherError) {
        console.error('Error sending Pusher events:', pusherError);
        // Continue with response even if Pusher fails
      }
    }
    
    // Get the updated notifications for the user
    const updatedNotifications = await prisma.notification.findMany({
      where: { userId: internalUserId },
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json({ 
      success: true,
      count: result.count,
      message: `Marked ${result.count} notifications as read`,
      notifications: updatedNotifications
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
} 