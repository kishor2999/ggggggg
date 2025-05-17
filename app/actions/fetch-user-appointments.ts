"use server"

import prisma from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { Decimal } from "@prisma/client/runtime/library";

// Helper function to safely serialize data
function serializeData(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }
  
  if (data instanceof Decimal) {
    return data.toString();
  }
  
  if (data instanceof Date) {
    return data.toISOString();
  }
  
  if (Array.isArray(data)) {
    return data.map(item => serializeData(item));
  }
  
  if (typeof data === 'object') {
    return Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, serializeData(value)])
    );
  }
  
  return data;
}

export default async function fetchUserAppointments() {
  // Get userId from query params (you may use clerkId or userId, depending on your app logic)
  const { userId } = await auth()

  if (!userId) {
    throw new Error("Missing clerk id")
  }

  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }, // or use userId depending on your authentication logic
      include: {
        appointments: {
          include: {
            service: true, // Include service data (name, description, etc.)
            vehicle: true, // Include vehicle data (type, model, plate)
            employee: {
              include: {
                user: true, // Include employee's user data for name
              }
            },
          },
        },
      },
    });

    if (!user) {
      throw new Error("User not found")
    }

    // Use the serializeData function to safely serialize everything
    const serializedAppointments = serializeData(user.appointments);

    
    return serializedAppointments;
  } catch (error) {
    console.error("Error fetching appointments:", error);
    throw new Error("Something went wrong")
  }
}
