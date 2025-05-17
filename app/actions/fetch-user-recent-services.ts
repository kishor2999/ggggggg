"use server"

import prisma from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export default async function fetchUserRecentServices(limit = 3) {
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

    // Fetch recent appointments (services) for this user
    const recentAppointments = await prisma.appointment.findMany({
      where: { 
        userId: user.id,
        status: "COMPLETED" 
      },
      include: {
        service: true,
        staff: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
      take: limit,
    });

    // Convert Decimal objects to strings to avoid serialization issues
    const serializedAppointments = recentAppointments.map(appointment => ({
      ...appointment,
      price: appointment.price.toString(),
      service: {
        ...appointment.service,
        price: appointment.service.price.toString(),
      },
      staff: appointment.staff ? {
        ...appointment.staff,
        user: appointment.staff.user,
      } : null,
    }));

    return serializedAppointments;
  } catch (error) {
    console.error("Error fetching recent services:", error);
    throw new Error("Failed to fetch recent services");
  }
} 