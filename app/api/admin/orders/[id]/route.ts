import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/db";

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
            phone: true,
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
    const { status } = await request.json();
    
    console.log("Updating order status:", orderId, "New status:", status);
    
    // Validate the status
    const validStatuses = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELED", "REFUNDED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid order status" },
        { status: 400 }
      );
    }
    
    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        payment: true,
      },
    });
    
    // If order is refunded, also update payment status
    if (status === "REFUNDED" && updatedOrder.payment) {
      await prisma.payment.update({
        where: { id: updatedOrder.payment.id },
        data: { status: "REFUNDED" },
      });
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