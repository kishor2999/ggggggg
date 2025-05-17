import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifySignature, checkTransactionStatus, ESEWA_CONFIG } from "@/lib/esewa-utils";
import { pusherServer } from "@/lib/pusher";

export async function GET(request: Request) {
  try {
    // Get URL parameters
    const url = new URL(request.url);
    
    // Log all query parameters for debugging
    console.log("All query parameters:", Object.fromEntries(url.searchParams.entries()));
    
    // Extract the 'data' parameter containing the Base64 encoded response
    const encodedData = url.searchParams.get("data");
    console.log("Encoded data received:", encodedData ? "yes" : "no");
    
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
      console.log("Decoded eSewa response:", responseData);
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
      console.log("Found matching order:", order.id);
      
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
          message: `Your payment of Rs${order.totalAmount} for the order has been received.`,
          type: 'PAYMENT',
          isRead: false
        }
      });

      // Send real-time notification to the user
      await pusherServer.trigger(`user-${order.userId}`, 'new-notification', {
        id: userNotification.id,
        title: userNotification.title,
        message: userNotification.message,
        type: userNotification.type,
        createdAt: userNotification.createdAt
      });
      
      // Get admin users to notify them
      const adminUsers = await prisma.user.findMany({
        where: { role: 'ADMIN' }
      });

      // Create notification for all admins
      for (const admin of adminUsers) {
        const adminNotification = await prisma.notification.create({
          data: {
            userId: admin.id,
            title: 'New Order Payment',
            message: `Order #${order.id.substring(0, 8)} payment of Rs${order.totalAmount} has been received.`,
            type: 'PAYMENT',
            isRead: false
          }
        });

        // Send real-time notification to each admin
        await pusherServer.trigger(`user-${admin.id}`, 'new-notification', {
          id: adminNotification.id,
          title: adminNotification.title,
          message: adminNotification.message,
          type: adminNotification.type,
          createdAt: adminNotification.createdAt
        });
      }
      
      console.log("E-commerce payment successful - redirecting to success page");
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
      console.log("Found matching appointment:", appointment.id);
      
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
          message: `Your payment of Rs${appointment.price} for the ${appointment.service.name} booking has been received.`,
          type: 'PAYMENT',
          isRead: false
        }
      });

      // Send real-time notification to the user
      await pusherServer.trigger(`user-${appointment.userId}`, 'new-notification', {
        id: userNotification.id,
        title: userNotification.title,
        message: userNotification.message,
        type: userNotification.type,
        createdAt: userNotification.createdAt
      });
      
      // Get admin users to notify them
      const adminUsers = await prisma.user.findMany({
        where: { role: 'ADMIN' }
      });

      // Create notification for all admins
      for (const admin of adminUsers) {
        const adminNotification = await prisma.notification.create({
          data: {
            userId: admin.id,
            title: 'New Booking Payment',
            message: `${appointment.user.name} has paid Rs${appointment.price} for ${appointment.service.name} service.`,
            type: 'PAYMENT',
            isRead: false
          }
        });

        // Send real-time notification to each admin
        await pusherServer.trigger(`user-${admin.id}`, 'new-notification', {
          id: adminNotification.id,
          title: adminNotification.title,
          message: adminNotification.message,
          type: adminNotification.type,
          createdAt: adminNotification.createdAt
        });
      }
      
      console.log("Car wash payment successful - redirecting to bookings");
      return NextResponse.redirect(`${url.origin}/dashboard/user/bookings?payment_success=true`);
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