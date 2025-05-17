import { NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';
import prisma from '@/lib/db';

// POST /api/test-notification - Send a test notification to a specific user role
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userRole, userId } = body;
    
    if (!userRole) {
      return NextResponse.json(
        { error: 'User role is required' },
        { status: 400 }
      );
    }
    
    // If userId is provided directly, use it; otherwise fetch a user with the specified role
    let user;
    if (userId) {
      user = await prisma.user.findUnique({
        where: { id: userId },
      });
      
      if (!user) {
        return NextResponse.json(
          { error: `No user found with ID ${userId}` },
          { status: 404 }
        );
      }
    } else {
      // Get the first user with the specified role (for testing)
      user = await prisma.user.findFirst({
        where: { role: userRole.toUpperCase() },
      });
      
      if (!user) {
        return NextResponse.json(
          { error: `No user found with role ${userRole}` },
          { status: 404 }
        );
      }
    }
    
    // Create a dummy notification based on the user's role
    let title = '';
    let message = '';
    let type = '';
    
    switch (userRole.toLowerCase()) {
      case 'admin':
        title = 'New Booking Alert';
        message = 'A new booking has been made. Please check the bookings page.';
        type = 'BOOKING';
        break;
      case 'user':
        title = 'Booking Confirmed';
        message = 'Your recent car wash booking has been confirmed!';
        type = 'BOOKING';
        break;
      case 'employee':
        title = 'New Task Assigned';
        message = 'You have been assigned a new car wash task.';
        type = 'TASK';
        break;
      default:
        title = 'System Notification';
        message = 'This is a test notification.';
        type = 'SYSTEM';
    }
    
    // Create notification in database
    const notification = await prisma.notification.create({
      data: {
        userId: user.id,
        title,
        message,
        type,
        isRead: false
      }
    });
    
        
    // Trigger Pusher event for real-time notification
    await pusherServer.trigger(`user-${user.id}`, 'new-notification', {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      createdAt: notification.createdAt
    });
    
        
    // Also trigger a general channel for the user role
    await pusherServer.trigger(`${userRole.toLowerCase()}-notifications`, 'new-notification', {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      createdAt: notification.createdAt
    });
    
        
    return NextResponse.json({
      success: true,
      message: `Test notification sent to ${userRole}`,
      notification,
      userId: user.id
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 