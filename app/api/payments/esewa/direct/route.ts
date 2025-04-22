import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/db';
import { ESEWA_CONFIG, createEsewaFormData } from '@/lib/esewa-utils';

export async function POST(request: Request) {
  try {
    const { userId: clerkId } = await auth();
    
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the database user
    const user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    // Get request body
    const { totalAmount, cartItems, paymentType = 'ecommerce' } = await request.json();

    if (!totalAmount) {
      return NextResponse.json(
        { error: 'Total amount is required' },
        { status: 400 }
      );
    }

    // Generate a unique payment reference ID
    const paymentReference = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    // Verify that products exist and have enough stock
    if (cartItems && cartItems.length > 0) {
      const productIds = cartItems.map((item: any) => item.productId);
      const products = await prisma.product.findMany({
        where: {
          id: { in: productIds }
        }
      });
      
      // Verify all products exist
      if (products.length !== productIds.length) {
        return NextResponse.json(
          { error: 'One or more products not found' },
          { status: 404 }
        );
      }
      
      // Verify stock is sufficient
      for (const item of cartItems) {
        const product = products.find(p => p.id === item.productId);
        if (product && product.stock < item.quantity) {
          return NextResponse.json(
            { error: `Not enough stock for ${product.name}` },
            { status: 400 }
          );
        }
      }
    }

    // Define success and failure URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    // Encode the cart items in the success URL to retrieve them after payment
    const encodedCartItems = encodeURIComponent(JSON.stringify(cartItems || []));
    const encodedUserId = encodeURIComponent(user.id);
    
    const successUrl = `${baseUrl}/api/payments/esewa/success?cart=${encodedCartItems}&userId=${encodedUserId}&type=${paymentType}`;
    const failureUrl = `${baseUrl}/dashboard/user/orders/failed`;

    // Create eSewa form data
    const formData = createEsewaFormData(
      totalAmount,
      paymentReference,
      successUrl,
      failureUrl,
      paymentReference // Using the payment reference as the payment_id
    );

    // Generate HTML for the form
    const formHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Redirecting to eSewa...</title>
        </head>
        <body>
          <form id="esewa-form" method="POST" action="${ESEWA_CONFIG.FORM_URL}">
            ${Object.entries(formData).map(([key, value]) => {
              // Special handling for the params object
              if (key === 'params') {
                return `<input type="hidden" name="${key}" value='${value}' />`;
              }
              return `<input type="hidden" name="${key}" value="${value}" />`;
            }).join('\n            ')}
          </form>
          <script>
            // The form will be submitted automatically
            document.getElementById('esewa-form').submit();
          </script>
        </body>
      </html>
    `;

    // Return the HTML form
    return new NextResponse(formHtml, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error: any) {
    console.error('Error initializing direct payment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initialize payment' },
      { status: 500 }
    );
  }
}

// Add support for GET requests
export async function GET(request: Request) {
  try {
    const { userId: clerkId } = await auth();
    
    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the database user
    const user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    // Get URL parameters
    const url = new URL(request.url);
    const totalAmount = url.searchParams.get('totalAmount');
    const cartItemsParam = url.searchParams.get('cartItems');
    const paymentType = url.searchParams.get('paymentType') || 'ecommerce';

    if (!totalAmount) {
      return NextResponse.json(
        { error: 'Total amount is required' },
        { status: 400 }
      );
    }

    // Parse cart items
    let cartItems = [];
    if (cartItemsParam) {
      try {
        cartItems = JSON.parse(decodeURIComponent(cartItemsParam));
      } catch (error) {
        console.error('Error parsing cart items:', error);
      }
    }

    // Generate a unique payment reference ID
    const paymentReference = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    // Define success and failure URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    // Encode the cart items in the success URL to retrieve them after payment
    const encodedCartItems = encodeURIComponent(JSON.stringify(cartItems || []));
    const encodedUserId = encodeURIComponent(user.id);
    
    const successUrl = `${baseUrl}/api/payments/esewa/success?cart=${encodedCartItems}&userId=${encodedUserId}&type=${paymentType}`;
    const failureUrl = `${baseUrl}/dashboard/user/orders/failed`;

    // Create eSewa form data
    const formData = createEsewaFormData(
      parseFloat(totalAmount),
      paymentReference,
      successUrl,
      failureUrl,
      paymentReference // Using the payment reference as the payment_id
    );

    // Generate HTML for the form
    const formHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Redirecting to eSewa...</title>
        </head>
        <body>
          <form id="esewa-form" method="POST" action="${ESEWA_CONFIG.FORM_URL}">
            ${Object.entries(formData).map(([key, value]) => {
              // Special handling for the params object
              if (key === 'params') {
                return `<input type="hidden" name="${key}" value='${value}' />`;
              }
              return `<input type="hidden" name="${key}" value="${value}" />`;
            }).join('\n            ')}
          </form>
          <script>
            // The form will be submitted automatically
            document.getElementById('esewa-form').submit();
          </script>
        </body>
      </html>
    `;

    // Return the HTML form
    return new NextResponse(formHtml, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error: any) {
    console.error('Error initializing direct payment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initialize payment' },
      { status: 500 }
    );
  }
} 