import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { ESEWA_CONFIG, createEsewaFormData } from '@/lib/esewa-utils';

export async function GET(request: Request) {
  try {
    // Generate a unique transaction UUID
    const transactionUuid = uuidv4();
    
    // Sample amount (100 NPR)
    const amount = 100;
    
    // Get origin for URLs
    const url = new URL(request.url);
    const origin = url.origin;
    
    // Success and failure URLs
    const successUrl = `${origin}/api/payments/esewa/success`;
    const failureUrl = `${origin}/api/payments/esewa/failure`;
    
    // Use the utility function to create form data
    const formData = createEsewaFormData(
      amount,
      transactionUuid,
      successUrl,
      failureUrl,
      "test-payment-id"
    );
    
    // HTML form for direct testing
    const formHtml = `
      <html>
        <head>
          <title>eSewa Test Form</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
            h2 { color: #333; }
            pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
            button { background: #4CAF50; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; }
            button:hover { background: #45a049; }
            .info { background: #e7f3fe; border-left: 6px solid #2196F3; padding: 10px; margin-bottom: 15px; }
          </style>
        </head>
        <body>
          <h2>eSewa Test Form</h2>
          
          <div class="info">
            <p>This is a test form for eSewa integration. It will initiate a test payment of Rs. ${amount}.</p>
          </div>
          
          <h3>Payment Details</h3>
          <pre>
Transaction UUID: ${transactionUuid}
Amount: ${amount}
Product Code: ${ESEWA_CONFIG.MERCHANT_CODE}
Success URL: ${successUrl}
Failure URL: ${failureUrl}
          </pre>
          
          <form method="POST" action="${ESEWA_CONFIG.FORM_URL}">
            ${Object.entries(formData).map(([key, value]) => 
              `<input type="hidden" name="${key}" value="${value}" />`
            ).join('')}
            <button type="submit">Submit Test Payment</button>
          </form>
        </body>
      </html>
    `;
    
    // Return debug information
    return new NextResponse(formHtml, {
      headers: {
        'Content-Type': 'text/html'
      }
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: 'Debug error' }, { status: 500 });
  }
} 