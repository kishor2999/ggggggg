"use server"
import prisma from '@/lib/db';
import { auth } from "@clerk/nextjs/server";

export async function getUserVehicles() {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const vehicles = await prisma.vehicle.findMany({
      where: {
        user: {
          clerkId: userId
        }
      }
    });
    return vehicles;
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    throw new Error('Failed to fetch vehicles');
  }
}

export async function createVehicle(data: {
  type: string;
  model: string;
  plate: string;
}) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // First, check if the user exists
    let dbUser = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    // If user doesn't exist, create them
    if (!dbUser) {
     throw new Error('User not found');
    }

    // Now create the vehicle with the correct userId
    const vehicle = await prisma.vehicle.create({
      data: {
        userId: dbUser.id, // Use the database user ID, not the Clerk ID
        type: data.type,
        model: data.model,
        plate: data.plate,
      }
    });
    return vehicle;
  } catch (error) {
    console.error('Error creating vehicle:', error);
    throw new Error('Failed to create vehicle');
  }
} 