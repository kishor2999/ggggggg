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

    (`Fetching recent services for user ${user.id} (clerkId: ${userId})`);

    // Fetch recent appointments (services) for this user - include all statuses now
    const recentAppointments = await prisma.appointment.findMany({
      where: { 
        userId: user.id,
        // Removed the status filter to show all appointments
      },
      include: {
        service: true,
        employee: {
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

    (`Found ${recentAppointments.length} recent appointments`);

    // Convert Decimal objects to strings to avoid serialization issues
    const serializedAppointments = recentAppointments.map(appointment => ({
      ...appointment,
      price: appointment.price.toString(),
      service: {
        ...appointment.service,
        price: appointment.service.price.toString(),
      },
      employee: appointment.employee ? {
        ...appointment.employee,
        user: appointment.employee.user,
      } : null,
    }));

    return serializedAppointments;
  } catch (error) {
    console.error("Error fetching recent services:", error);
    throw new Error("Failed to fetch recent services");
  }
} 