"use server"

import prisma from "@/lib/db"
import { clerkClient } from "@clerk/nextjs/server";

export async function getUsers() {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    return users;
  } catch (error) {
    console.error('Error fetching users:', error);
    throw new Error('Failed to fetch users');
  }
}

export async function updateUserRole(userId: string, role: string) {
    const client = await clerkClient();
  try {
    // Get the user from database to get their clerkId
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user?.clerkId) {
      throw new Error('User not found or missing Clerk ID');
    }

    // Update role in Clerk
    await client.users.updateUserMetadata(user.clerkId, {
      publicMetadata: { role }
    });

    // Also update in our database to keep it in sync
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role }
    });

    // If role is being changed to staff, create or update staff record
    if (role === 'staff') {
      await prisma.staff.upsert({
        where: { userId: userId },
        update: { 
          role: 'CLEANER', // Default role for staff
          updatedAt: new Date()
        },
        create: {
          userId: userId,
          role: 'CLEANER', // Default role for staff
          averageRating: 0,
          totalReviews: 0
        }
      });
    }

    return updatedUser;
  } catch (error) {
    console.error('Error updating user role:', error);
    throw new Error('Failed to update user role');
  }
} 