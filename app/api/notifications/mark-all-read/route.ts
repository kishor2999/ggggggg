import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

// PUT /api/notifications/mark-all-read?userId=xyz - Mark all notifications as read for a user
export async function PUT(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Update all unread notifications for the user
    const result = await prisma.notification.updateMany({
      where: { 
        userId,
        isRead: false
      },
      data: { 
        isRead: true 
      }
    });
    
    return NextResponse.json({ 
      success: true,
      count: result.count,
      message: `Marked ${result.count} notifications as read`
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 