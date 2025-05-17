import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { pusherServer, getUserChannel, EVENT_TYPES } from '@/lib/pusher';

// PUT /api/notifications/:id/read - Mark a notification as read
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      );
    }
    
    console.log(`Marking notification ${id} as read`);
    
    // Update the notification in the database
    const notification = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
      include: {
        user: true // Include the user to get the clerk ID
      }
    });
    
    console.log(`Successfully updated notification in database:`, notification);
    
    // Determine which user ID to use for Pusher (prefer clerk ID if available)
    let userId = notification.userId;
    let clerkId = notification.user?.clerkId;
    
    console.log(`Internal user ID: ${userId}, Clerk ID: ${clerkId || 'not found'}`);
    
    // Trigger a Pusher event to notify other components about the status change
    if (userId) {
      // If we have both IDs, use clerk ID for Pusher but send both
      const pusherUserId = clerkId || userId;
      
      console.log(`Sending Pusher event to ${getUserChannel(pusherUserId)} and user-db-${pusherUserId}`);
      
      // Define the event payload
      const eventPayload = {
        action: 'read',
        notificationId: notification.id,
        userId: pusherUserId, // Use the Clerk ID for client-side matching
        internalUserId: userId,
        timestamp: new Date().toISOString()
      };
      
      try {
        // Send to primary user channel
        await pusherServer.trigger(
          getUserChannel(pusherUserId),
          EVENT_TYPES.NOTIFICATION_STATUS_UPDATED,
          eventPayload
        );
        
        // Also send to the DB-specific channel for compatibility
        await pusherServer.trigger(
          `user-db-${pusherUserId}`,
          EVENT_TYPES.NOTIFICATION_STATUS_UPDATED,
          eventPayload
        );
        
        console.log('Pusher events sent successfully');
      } catch (pusherError) {
        console.error('Error sending Pusher events:', pusherError);
        // Continue with response even if Pusher fails
      }
    }
    
    return NextResponse.json({
      success: true,
      notification: notification,
      message: 'Notification marked as read successfully'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
} 