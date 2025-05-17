"use server"

import prisma from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export default async function fetchUserPayments() {
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

    // Fetch all payments for this user
    const payments = await prisma.payment.findMany({
      where: { userId: user.id },
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

    // Convert Decimal objects to strings to avoid serialization issues
    const serializedPayments = payments.map(payment => ({
      ...payment,
      amount: payment.amount.toString(),
      order: payment.order ? {
        ...payment.order,
        totalAmount: payment.order.totalAmount.toString(),
      } : null,
      appointment: payment.appointment ? {
        ...payment.appointment,
        price: payment.appointment.price.toString(),
        service: {
          ...payment.appointment.service,
          price: payment.appointment.service.price.toString(),
        }
      } : null,
    }));

    return serializedPayments;
  } catch (error) {
    console.error("Error fetching user payments:", error);
    throw new Error("Failed to fetch payments");
  }
} 