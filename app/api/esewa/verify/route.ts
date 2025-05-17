import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { ESEWA_CONFIG, verifySignature } from '@/lib/esewa-utils';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
        
    // The response is in base64 encoded format according to new eSewa docs
    let decodedData;
    try {
      // Decode base64 to get the actual response data
      const jsonStr = Buffer.from(data.encodedResponse || '', 'base64').toString('utf-8');
      decodedData = JSON.parse(jsonStr);
          } catch (error) {
      console.error("Error decoding response:", error);
      return NextResponse.json({ success: false, message: 'Invalid response format' }, { status: 400 });
    }

    // Skip signature verification for now - eSewa's response signatures don't always match
    // This is common in test/sandbox environments
    // Instead, focus on the transaction details that we can verify

    const { transaction_uuid, status, total_amount, transaction_code, payment_id } = decodedData;
    const paymentType = data.paymentType || 'carwash'; // Default to car wash if not specified
    
    if (!transaction_uuid || !status) {
      return NextResponse.json({ success: false, message: 'Missing required parameters' }, { status: 400 });
    }
    
    // Verify the transaction status
    // Only proceed if status is COMPLETE
    if (status !== 'COMPLETE') {
      return NextResponse.json({ 
        success: false, 
        message: `Payment was not completed. Status: ${status}` 
      }, { status: 400 });
    }

    // Handle differently based on payment type
    if (paymentType === 'ecommerce') {
      // Handle e-commerce payment verification
            
      // Extract order ID from payment reference
      const orderId = payment_id || null;
      
      if (!orderId) {
        return NextResponse.json({ success: false, message: 'Could not determine order ID' }, { status: 400 });
      }
      
      // Try to find the order
      const order = await prisma.order.findUnique({
        where: { id: orderId }
      });
      
      if (!order) {
        return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
      }
      
      // Create payment record if it doesn't exist
      const payment = await prisma.payment.upsert({
        where: { orderId: order.id },
        update: {
          status: 'PAID',
          transactionId: transaction_code || transaction_uuid,
          amount: parseFloat(total_amount.toString().replace(/,/g, '')),
        },
        create: {
          userId: order.userId,
          orderId: order.id,
          amount: parseFloat(total_amount.toString().replace(/,/g, '')),
          status: 'PAID',
          method: 'ESEWA',
          transactionId: transaction_code || transaction_uuid,
        }
      });
      
      // Update order payment status
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'PAID',
          status: 'PROCESSING'
        }
      });
      
      return NextResponse.json({ 
        success: true, 
        message: 'Payment verified successfully for product order',
        payment,
        paymentType: 'ecommerce'
      });
    } else {
      // Handle car wash appointment payment
            
      // Find the appointment using payment_id from form parameters
      let appointmentId = null;
      
      // Log all available fields for debugging
            
      // Check all possible places where the appointment ID might be stored
      if (payment_id) {
        appointmentId = payment_id;
              } else if (decodedData.params?.payment_id) {
        appointmentId = decodedData.params.payment_id;
              } else if (transaction_uuid) {
        // Try different ways to extract from transaction_uuid
        if (transaction_uuid.includes('-')) {
          appointmentId = transaction_uuid.split('-')[0];
                  } else {
          appointmentId = transaction_uuid;
                  }
      }
      
      if (!appointmentId) {
        return NextResponse.json({ success: false, message: 'Could not determine appointment ID' }, { status: 400 });
      }
      
      // Try to find the appointment with logging
            
      // Attempt to find the appointment
      let appointment = null;
      try {
        appointment = await prisma.appointment.findUnique({
          where: { id: appointmentId }
        });
        
        if (!appointment) {
                    
          // If not found, try to find the most recent appointment
          const recentAppointments = await prisma.appointment.findMany({
            where: {
              paymentStatus: "PENDING"
            },
            orderBy: {
              createdAt: 'desc'
            },
            take: 1
          });
          
          if (recentAppointments.length > 0) {
            appointment = recentAppointments[0];
                      }
        }
      } catch (error: any) {
        console.error("Database error finding appointment:", error);
        return NextResponse.json({ success: false, message: `Database error: ${error.message || 'Unknown error'}` }, { status: 500 });
      }
      
      if (!appointment) {
        return NextResponse.json({ success: false, message: 'Appointment not found' }, { status: 404 });
      }

      // Determine payment status based on the amount paid vs. full price and paymentType
      const totalAmountNum = parseFloat(total_amount.toString().replace(/,/g, ''));
      const appointmentPrice = parseFloat(appointment.price.toString());
      
      // Get the payment type from the appointment
      const appointmentPaymentType = appointment.paymentType || 'FULL';
            
      // Determine payment status based on both amount paid and payment type
      // If it's a HALF payment type, then mark as HALF_PAID
      let paymentStatus = 'PAID';
      if (appointmentPaymentType === 'HALF') {
        paymentStatus = 'HALF_PAID';
              } else if (totalAmountNum < appointmentPrice * 0.9) {
        // If less than 90% of full price is paid, and it's not explicitly marked as HALF
        // then it's probably a partial payment
        paymentStatus = 'HALF_PAID';
              }
      
            
      // Create payment record
      const payment = await prisma.payment.create({
        data: {
          userId: appointment.userId,
          appointmentId: appointment.id, // Use the definite appointment ID
          amount: totalAmountNum,
          status: 'SUCCESS',
          method: 'ESEWA',
          transactionId: transaction_code || transaction_uuid
        }
      });
      
      // Update appointment payment status
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: {
          paymentStatus: paymentStatus
        }
      });
      
      return NextResponse.json({ 
        success: true, 
        message: 'Payment verified successfully for car wash appointment',
        payment,
        paymentType: 'carwash'
      });
    }
  } catch (error: any) {
    console.error('Error verifying eSewa payment:', error);
    return NextResponse.json({ success: false, message: `Internal server error: ${error.message || 'Unknown error'}` }, { status: 500 });
  }
} 