import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import prisma from '@/lib/db';
import { ESEWA_CONFIG, createEsewaFormData } from '@/lib/esewa-utils';

// Initialize a payment with eSewa
export async function POST(request: Request) {
  try {
    const { orderId, totalAmount } = await request.json();

    // Fetch the order to confirm it exists and get details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true, items: { include: { product: true } } }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Generate a unique transaction UUID using uuidv4
    const transactionUuid = uuidv4();

    // Create or update a payment record in the database
    const payment = await prisma.payment.upsert({
      where: { orderId },
      update: {
        amount: order.totalAmount,
        status: 'PENDING',
        method: 'ESEWA',
        transactionId: transactionUuid,
      },
      create: {
        userId: order.userId,
        orderId: order.id,
        amount: order.totalAmount,
        status: 'PENDING',
        method: 'ESEWA',
        transactionId: transactionUuid,
      }
    });

    // Format amount - eSewa expects integers for amount values in test mode
    const roundedAmount = Math.round(Number(totalAmount));
    
    // Get the origin for success and failure URLs
    const origin = request.headers.get('origin') || 'http://localhost:3000';
    
    // Absolute URLs are required for eSewa callbacks
    const successUrl = `${origin}/api/payments/esewa/success`;
    const failureUrl = `${origin}/api/payments/esewa/failure`;

    // Create form data using the utility function
    const formData = createEsewaFormData(
      roundedAmount,
      transactionUuid,
      successUrl,
      failureUrl,
      payment.id
    );

    // Generate direct HTML form for testing
    const formHtml = `
      <html>
        <head>
          <title>eSewa Payment</title>
          <script>
            // Auto-submit the form when loaded
            window.onload = function() {
              document.getElementById('esewaForm').submit();
            }
          </script>
        </head>
        <body>
          <h2>Redirecting to eSewa...</h2>
          <p>Please wait, you will be redirected to eSewa payment page.</p>
          <form id="esewaForm" method="POST" action="${ESEWA_CONFIG.FORM_URL}">
            ${Object.entries(formData).map(([key, value]) => 
              `<input type="hidden" name="${key}" value="${value}" />`
            ).join('')}
          </form>
        </body>
      </html>
    `;

    // Store the transaction details for future reference
    console.log('Payment initiated:', {
      paymentId: payment.id,
      transactionUuid,
      amount: roundedAmount
    });

    // Return the HTML form directly
    return new NextResponse(formHtml, {
      headers: {
        'Content-Type': 'text/html'
      }
    });
  } catch (error) {
    console.error('Error processing eSewa payment:', error);
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    );
  }
} 