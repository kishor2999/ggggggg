import prisma from "@/lib/db";
import { verifySignature } from "@/lib/esewa-utils";
import { EVENT_TYPES, getAdminChannel, getUserChannel, pusherServer } from "@/lib/pusher";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    // Get URL parameters
    const url = new URL(request.url);
    
    // Log all query parameters for debugging
  
    
    // Extract the 'data' parameter containing the Base64 encoded response
    const encodedData = url.searchParams.get("data");
  
    
    // Handle the case where no data is received
    if (!encodedData) {
      console.error("No encoded data received from eSewa");
      return NextResponse.redirect(`${url.origin}/dashboard/user/orders/failed?reason=no_data`);
    }
    
    // Decode the Base64 data
    let responseData;
    try {
      const decodedData = Buffer.from(encodedData, "base64").toString();
      responseData = JSON.parse(decodedData);
     
    } catch (error) {
      console.error("Error decoding eSewa response:", error);
      return NextResponse.redirect(`${url.origin}/dashboard/user/orders/failed?reason=invalid_response`);
    }
    
    // Check for required fields in the response
    if (!responseData.transaction_uuid || !responseData.status) {
      console.error("Missing required fields in eSewa response");
      return NextResponse.redirect(`${url.origin}/dashboard/user/orders/failed?reason=invalid_data`);
    }
    
    // Verify the signature
    if (!verifySignature(responseData)) {
      console.error("Invalid signature in eSewa response");
      return NextResponse.redirect(`${url.origin}/dashboard/user/orders/failed?reason=invalid_signature`);
    }
    
    // Check status
    if (responseData.status !== "COMPLETE") {
      console.error("Payment not complete:", responseData.status);
      return NextResponse.redirect(`${url.origin}/dashboard/user/orders/failed?reason=payment_failed&status=${responseData.status}`);
    }

    // Get the transaction UUID from response
    const transactionUuid = responseData.transaction_uuid;
    
    // First, try to find an order with this transaction ID
    const order = await prisma.order.findFirst({
      where: {
        transactionId: transactionUuid,
      }
    });

    // If order is found, process e-commerce payment
    if (order) {
    
      
      // Update the order status
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "PAID",
          status: "PROCESSING"
        }
      });
      
      // Create payment record
      const payment = await prisma.payment.create({
        data: {
          userId: order.userId,
          orderId: order.id,
          amount: parseFloat(order.totalAmount.toString()),
          status: "PAID",
          method: "ESEWA",
          transactionId: responseData.transaction_code || transactionUuid
        }
      });
      
      // Create notification for the user
      const userNotification = await prisma.notification.create({
        data: {
          userId: order.userId,
          title: 'Payment Successful',
          message: `Your payment of Rs${order.totalAmount} for the order has been received. Your order is being processed.`,
          type: 'PAYMENT',
          isRead: false
        }
      });

      // Get the user record to check for clerkId
      const orderUser = await prisma.user.findUnique({
        where: { id: order.userId },
        select: { clerkId: true, name: true }
      });

      // Notification data to be sent
      const notificationData = {
        id: userNotification.id,
        title: userNotification.title,
        message: userNotification.message,
        type: userNotification.type,
        createdAt: userNotification.createdAt,
        isRead: false
      };

      (`Sending notification to user with DB ID: ${order.userId}`);
      
      // Send real-time notification to the user
      await pusherServer.trigger(getUserChannel(order.userId), EVENT_TYPES.NEW_NOTIFICATION, notificationData);

      // Send to Clerk user ID channel if available
      if (orderUser?.clerkId) {
        (`Also sending notification to Clerk ID: ${orderUser.clerkId}`);
        await pusherServer.trigger(getUserChannel(orderUser.clerkId), EVENT_TYPES.NEW_NOTIFICATION, notificationData);
      }

      // Get admin users to notify them
      const adminUsers = await prisma.user.findMany({
        where: { 
          role: { 
            equals: 'ADMIN', 
            mode: 'insensitive' 
          } 
        }
      });

      (`Found ${adminUsers.length} admin users to notify about new order payment`);

      // Create notification for all admins
      for (const admin of adminUsers) {
        // Create more detailed message for admins
        const orderItems = await prisma.orderItem.findMany({
          where: { orderId: order.id },
          include: { product: true }
        });
        
        const itemCount = orderItems.reduce((sum, item) => sum + item.quantity, 0);
        const customerName = orderUser?.name || "A customer";
        
        const adminNotification = await prisma.notification.create({
          data: {
            userId: admin.id,
            title: 'New Order Payment',
            message: `${customerName} has paid Rs${order.totalAmount} for ${itemCount} item(s). Order #${order.id.substring(0, 8)}.`,
            type: 'PAYMENT',
            isRead: false
          }
        });

        // Admin notification data
        const adminNotificationData = {
          id: adminNotification.id,
          title: adminNotification.title,
          message: adminNotification.message,
          type: adminNotification.type,
          createdAt: adminNotification.createdAt,
          isRead: false
        };

        (`Sending notification to admin: ${admin.id}`);
        
        // Send real-time notification to each admin's DB ID channel
        await pusherServer.trigger(getUserChannel(admin.id), EVENT_TYPES.NEW_NOTIFICATION, adminNotificationData);
        
        // Also send to admin's Clerk ID if available
        if (admin.clerkId) {
          (`Also sending notification to admin's Clerk ID: ${admin.clerkId}`);
          await pusherServer.trigger(getUserChannel(admin.clerkId), EVENT_TYPES.NEW_NOTIFICATION, adminNotificationData);
        }
      }
      
      // Also trigger a general admin channel notification
      await pusherServer.trigger(getAdminChannel(), EVENT_TYPES.NEW_NOTIFICATION, {
        message: `New order payment received: Rs${order.totalAmount}`,
        orderId: order.id,
        timestamp: new Date().toISOString()
      });
      
      ("E-commerce payment successful - redirecting to success page");
      return NextResponse.redirect(`${url.origin}/dashboard/user/orders/success?order_id=${order.id}&clear_cart=true`);
    }
    
    // If no order found, check for an appointment with this reference
    const appointment = await prisma.appointment.findFirst({
      where: {
        AND: [
          { paymentMethod: "ESEWA" },
          { paymentStatus: "PENDING" }
        ]
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 1,
      include: {
        service: true,
        user: true
      }
    });
    
    // If appointment found, process car wash payment
    if (appointment) {
      
      
      // Update the appointment status
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: {
          paymentStatus: "PAID"
        }
      });
      
      // Create payment record
      const payment = await prisma.payment.create({
        data: {
          userId: appointment.userId,
          appointmentId: appointment.id,
          amount: parseFloat(appointment.price.toString()),
          status: "PAID",
          method: "ESEWA",
          transactionId: responseData.transaction_code || transactionUuid
        }
      });
      
      // Create notification for the user
      const userNotification = await prisma.notification.create({
        data: {
          userId: appointment.userId,
          title: 'Payment Successful',
          message: `Your payment of Rs${appointment.price} for the ${appointment.service.name} booking has been received. We look forward to serving you!`,
          type: 'PAYMENT',
          isRead: false
        }
      });

      // Get the user record to check for clerkId
      const user = await prisma.user.findUnique({
        where: { id: appointment.userId },
        select: { clerkId: true, name: true }
      });

      // Notification data to be sent
      const notificationData = {
        id: userNotification.id,
        title: userNotification.title,
        message: userNotification.message,
        type: userNotification.type,
        createdAt: userNotification.createdAt,
        isRead: false
      };

      // Log notification details
      (`Sending notification to user: ${appointment.userId} with ID: ${userNotification.id}`);

      // Send to DB user ID channel
      await pusherServer.trigger(getUserChannel(appointment.userId), EVENT_TYPES.NEW_NOTIFICATION, notificationData);

      // Send to Clerk user ID channel if available
      if (user?.clerkId) {
        (`Also sending notification to Clerk ID: ${user.clerkId}`);
        await pusherServer.trigger(getUserChannel(user.clerkId), EVENT_TYPES.NEW_NOTIFICATION, notificationData);
      }

      // Get admin users to notify them
      const adminUsers = await prisma.user.findMany({
        where: { 
          role: { 
            equals: 'ADMIN', 
            mode: 'insensitive' 
          } 
        }
      });

      (`Found ${adminUsers.length} admin users to notify about new appointment payment`);

      // Create notification for all admins
      for (const admin of adminUsers) {
        // Format date for admin notification
        const appointmentDate = appointment.date ? 
          new Date(appointment.date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          }) : 'scheduled';
        
        const customerName = user?.name || "A customer";
        
        const adminNotification = await prisma.notification.create({
          data: {
            userId: admin.id,
            title: 'New Service Booking Payment',
            message: `${customerName} has paid Rs${appointment.price} for ${appointment.service.name} service on ${appointmentDate}.`,
            type: 'PAYMENT',
            isRead: false
          }
        });

        // Admin notification data
        const adminNotificationData = {
          id: adminNotification.id,
          title: adminNotification.title,
          message: adminNotification.message,
          type: adminNotification.type,
          createdAt: adminNotification.createdAt,
          isRead: false
        };

        (`Sending notification to admin: ${admin.id} with ID: ${adminNotification.id}`);
        
        // Send real-time notification to each admin
        await pusherServer.trigger(getUserChannel(admin.id), EVENT_TYPES.NEW_NOTIFICATION, adminNotificationData);
        
        // Also send to admin's Clerk ID if available
        if (admin.clerkId) {
          (`Also sending notification to admin's Clerk ID: ${admin.clerkId}`);
          await pusherServer.trigger(getUserChannel(admin.clerkId), EVENT_TYPES.NEW_NOTIFICATION, adminNotificationData);
        }
      }
      
      // Also trigger a general admin channel notification
      await pusherServer.trigger(getAdminChannel(), EVENT_TYPES.NEW_NOTIFICATION, {
        message: `New service booking payment received: Rs${appointment.price}`,
        appointmentId: appointment.id,
        serviceName: appointment.service.name,
        timestamp: new Date().toISOString()
      });
      
      ("Car wash payment successful - redirecting to bookings");
      
      // Create a properly encoded redirect URL
      const successUrl = new URL(`${url.origin}/dashboard/user/bookings`);
      successUrl.searchParams.append('payment_success', 'true');
      
      return NextResponse.redirect(successUrl.toString());
    }
    
    // If no matching transaction found
    console.error("No matching order or appointment found for transaction:", transactionUuid);
    return NextResponse.redirect(`${url.origin}/dashboard/user/orders/failed?reason=transaction_not_found`);
    
  } catch (error) {
    console.error("Error processing eSewa response:", error);
    const url = new URL(request.url);
    return NextResponse.redirect(`${url.origin}/dashboard/user/orders/failed?reason=server_error`);
  }
} 