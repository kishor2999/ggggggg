import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: Request) {
  try {
    // Get URL parameters
    const url = new URL(request.url);
    const data = url.searchParams.get("data");

    console.log("Raw failure response data:", data);

    if (!data) {
      console.error("No data received from eSewa");
      return NextResponse.redirect(
        `Rs{url.origin}/dashboard/user/orders/failed?reason=no_data`
      );
    }

    // Decode the Base64 response
    let decodedData: string;
    let responseBody: any;

    try {
      decodedData = Buffer.from(data, "base64").toString();
      responseBody = JSON.parse(decodedData);
      console.log("Decoded eSewa failure response:", responseBody);
    } catch (error) {
      console.error("Error decoding failure response:", error);
      return NextResponse.redirect(
        `Rs{url.origin}/dashboard/user/orders/failed?reason=invalid_response`
      );
    }

    const {
      transaction_uuid,
      status = "FAILED",
      message = "Payment failed",
    } = responseBody;

    // Find payment by transaction UUID
    const payment = await prisma.payment.findFirst({
      where: { transactionId: transaction_uuid },
    });

    if (payment) {
      console.log("Found payment record for failed transaction:", payment);

      // Update payment status to FAILED
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
        },
      });

      // Update order status if there is an order
      if (payment.orderId) {
        await prisma.order.update({
          where: { id: payment.orderId },
          data: {
            status: "PAYMENT_FAILED",
            paymentStatus: "FAILED",
          },
        });
      }
    } else {
      console.warn(
        "No payment record found for transaction:",
        transaction_uuid
      );
    }

    // Redirect to the failed payment page with error information
    const failureUrl = new URL(`Rs{url.origin}/dashboard/user/orders/failed`);
    failureUrl.searchParams.append("reason", "payment_failed");
    failureUrl.searchParams.append("message", message);
    failureUrl.searchParams.append("status", status);

    return NextResponse.redirect(failureUrl);
  } catch (error) {
    console.error("Error processing eSewa failure callback:", error);
    const url = new URL(request.url);
    return NextResponse.redirect(
      `Rs{url.origin}/dashboard/user/orders/failed?reason=server_error`
    );
  }
}
