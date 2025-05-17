"use server"

import prisma from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export default async function fetchUserLatestPayment() {
  // Get userId from Clerk authentication
  const { userId } = await auth();

  if (!userId) {
    throw new Error("User not authenticated");
  }

  try {
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    console.log(`Fetching latest payment for user ${user.id} (clerkId: ${userId})`);

    // Fetch the latest payment for this user - include all payment statuses
    const latestPayment = await prisma.payment.findFirst({
      where: { 
        userId: user.id
        // Removed status filter to show any payment status
      },
      include: {
        order: true,
        appointment: {
          include: {
            service: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!latestPayment) {
      console.log("No payments found for this user");
      return null;
    }

    console.log(`Found payment with ID: ${latestPayment.id}, status: ${latestPayment.status}`);

    // Convert Decimal objects to strings to avoid serialization issues
    const serializedPayment = {
      ...latestPayment,
      amount: latestPayment.amount.toString(),
      order: latestPayment.order ? {
        ...latestPayment.order,
        totalAmount: latestPayment.order.totalAmount.toString(),
      } : null,
      appointment: latestPayment.appointment ? {
        ...latestPayment.appointment,
        price: latestPayment.appointment.price.toString(),
        service: {
          ...latestPayment.appointment.service,
          price: latestPayment.appointment.service.price.toString(),
        }
      } : null,
    };

    return serializedPayment;
  } catch (error) {
    console.error("Error fetching latest payment:", error);
    throw new Error("Failed to fetch latest payment");
  }
} 