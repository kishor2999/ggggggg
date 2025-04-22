import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// eSewa testing environment URL
const ESEWA_STATUS_URL = "https://rc.esewa.com.np/api/epay/transaction/status/";
// Production URL: 'https://epay.esewa.com.np/api/epay/transaction/status/'

// eSewa product code from environment variables
const ESEWA_PRODUCT_CODE = "EPAYTEST"; // For testing

export async function POST(request: Request) {
  try {
    const { transaction_uuid, total_amount } = await request.json();

    // Build status check URL
    const statusCheckUrl = `Rs{ESEWA_STATUS_URL}?product_code=Rs{ESEWA_PRODUCT_CODE}&total_amount=Rs{total_amount}&transaction_uuid=Rs{transaction_uuid}`;

    // Make request to eSewa status API
    const response = await fetch(statusCheckUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`eSewa status check failed: Rs{response.statusText}`);
    }

    const statusData = await response.json();

    // Find the payment record
    const payment = await prisma.payment.findFirst({
      where: { transactionId: transaction_uuid },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Update payment status based on eSewa response
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: statusData.status,
        transactionId: statusData.ref_id || payment.transactionId,
      },
    });

    // Update order status if it exists
    if (payment.orderId) {
      let orderStatus = "PENDING";
      let paymentStatus = "PENDING";

      // Map eSewa status to our order statuses
      switch (statusData.status) {
        case "COMPLETE":
          orderStatus = "PAID";
          paymentStatus = "SUCCESS";
          break;
        case "PENDING":
          orderStatus = "PENDING";
          paymentStatus = "PENDING";
          break;
        case "FULL_REFUND":
        case "PARTIAL_REFUND":
          orderStatus = "REFUNDED";
          paymentStatus = "REFUND";
          break;
        case "CANCELED":
        case "NOT_FOUND":
          orderStatus = "CANCELED";
          paymentStatus = "FAILED";
          break;
        default:
          orderStatus = "PENDING";
          paymentStatus = "PENDING";
      }

      await prisma.order.update({
        where: { id: payment.orderId },
        data: {
          status: orderStatus,
          paymentStatus: paymentStatus,
        },
      });
    }

    return NextResponse.json({
      success: true,
      status: statusData.status,
      esewaRefId: statusData.ref_id,
    });
  } catch (error) {
    console.error("Error checking eSewa payment status:", error);
    return NextResponse.json(
      { error: "Failed to check payment status" },
      { status: 500 }
    );
  }
}
