import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

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
    
    // Update the notification in the database
    const notification = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });
    
    return NextResponse.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 