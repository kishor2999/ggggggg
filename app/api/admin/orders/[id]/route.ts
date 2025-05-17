import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/db";
import { pusherServer, getUserChannel, EVENT_TYPES } from "@/lib/pusher";

// Helper to check admin access - not being used currently for demo purposes
async function checkAdminAccess(userId: string | null) {
  if (!userId) return false;
  
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { role: true },
  });
  
  return user && user.role === "ADMIN";
}

// Get order details by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Skip auth for demo purposes
    // const authData = await auth();
    // const userId = authData.userId;
    // const isAdmin = await checkAdminAccess(userId);
    
    // if (!isAdmin) {
    //   return NextResponse.json(
    //     { error: "Unauthorized" },
    //     { status: 401 }
    //   );
    // }
    
    const orderId = params.id;
    console.log("Fetching order details for ID:", orderId);
    
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                description: true,
                images: true,
              },
            },
          },
        },
        payment: true,
      },
    });
    
    if (!order) {
      console.log("Order not found with ID:", orderId);
      // For debugging purposes, get all order IDs to see what's available
      const allOrders = await prisma.order.findMany({
        select: { id: true },
        take: 10
      });
      console.log("Available order IDs (first 10):", allOrders.map(o => o.id));
      
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }
    
    console.log("Order found:", order.id);
    
    // Serialize Decimal values to avoid Next.js serialization issues
    const serializedOrder = {
      ...order,
      totalAmount: order.totalAmount.toString(),
      items: order.items.map(item => ({
        ...item,
        price: item.price.toString(),
      })),
      payment: order.payment 
        ? {
            ...order.payment,
            amount: order.payment.amount.toString()
          } 
        : null
    };
    
    return NextResponse.json(serializedOrder);
  } catch (error) {
    console.error("Error fetching order details:", error);
    return NextResponse.json(
      { error: "Failed to fetch order details" },
      { status: 500 }
    );
  }
}

// Update order status
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Skip auth check for demo
    // const authData = await auth();
    // const userId = authData.userId;
    // const isAdmin = await checkAdminAccess(userId);
    
    // if (!isAdmin) {
    //   return NextResponse.json(
    //     { error: "Unauthorized" },
    //     { status: 401 }
    //   );
    // }
    
    const orderId = params.id;
    const { status, sendNotification } = await request.json();
    
    console.log("Updating order status:", orderId, "New status:", status);
    
    // Validate the status
    const validStatuses = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELED", "REFUNDED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid order status" },
        { status: 400 }
      );
    }
    
    // Get the order before updating to compare old and new status
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true }
    });
    
    if (!existingOrder) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }
    
    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        payment: true,
        user: true,
      },
    });
    
    // If order is refunded, also update payment status
    if (status === "REFUNDED" && updatedOrder.payment) {
      await prisma.payment.update({
        where: { id: updatedOrder.payment.id },
        data: { status: "REFUNDED" },
      });
    }
    
    // Send notification to user if requested
    if (sendNotification && existingOrder.status !== status) {
      try {
        // Get user from the order
        const userId = updatedOrder.userId;
        
        // Get more detailed user info
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { 
            id: true,
            clerkId: true,
            name: true,
            email: true 
          }
        });
        
        if (user) {
          // Create different messages based on status
          let title = 'Order Status Updated';
          let message = `Your order #${orderId.substring(0, 8)} status has been updated to ${status}.`;
          
          // Customize message based on new status
          switch(status) {
            case 'PROCESSING':
              message = `Your order #${orderId.substring(0, 8)} is now being processed. We'll update you when it ships.`;
              break;
            case 'SHIPPED':
              message = `Good news! Your order #${orderId.substring(0, 8)} has been shipped and is on its way.`;
              break;
            case 'DELIVERED':
              message = `Your order #${orderId.substring(0, 8)} has been delivered. Thank you for your purchase!`;
              break;
            case 'CANCELED':
              message = `Your order #${orderId.substring(0, 8)} has been canceled. Please contact support if you have any questions.`;
              break;
            case 'REFUNDED':
              message = `Your order #${orderId.substring(0, 8)} has been refunded. The amount should appear in your account within a few business days.`;
              break;
          }
          
          // Create notification in database
          const notification = await prisma.notification.create({
            data: {
              userId: user.id,
              title,
              message,
              type: 'ORDER',
              isRead: false
            }
          });
          
          console.log(`Created notification for user ${user.id}:`, notification.id);
          
          // Notification data to be sent via Pusher
          const notificationData = {
            id: notification.id,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            createdAt: notification.createdAt,
            isRead: false
          };
          
          // Send to user's DB ID channel
          await pusherServer.trigger(getUserChannel(user.id), EVENT_TYPES.NEW_NOTIFICATION, notificationData);
          
          // Also send to Clerk ID if available
          if (user.clerkId) {
            console.log(`Also sending to Clerk ID: ${user.clerkId}`);
            await pusherServer.trigger(getUserChannel(user.clerkId), EVENT_TYPES.NEW_NOTIFICATION, notificationData);
          }
          
          console.log(`Notification sent to user about order status change to ${status}`);
        } else {
          console.error("Could not find user to send notification to");
        }
      } catch (notificationError) {
        console.error("Error sending notification:", notificationError);
        // Continue with the response even if notification fails
      }
    }
    
    // Serialize decimal values
    const serializedOrder = {
      ...updatedOrder,
      totalAmount: updatedOrder.totalAmount.toString(),
      payment: updatedOrder.payment 
        ? {
            ...updatedOrder.payment,
            amount: updatedOrder.payment.amount.toString()
          } 
        : null
    };
    
    return NextResponse.json(serializedOrder);
  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json(
      { error: "Failed to update order status" },
      { status: 500 }
    );
  }
} 