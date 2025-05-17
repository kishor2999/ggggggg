"use server"

import prisma from "@/lib/db"
import { clerkClient } from "@clerk/nextjs/server";
import { auth } from "@clerk/nextjs/server";

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

    // If role is being changed to employee, create or update employee record
    if (role === 'employee') {
      await prisma.employee.upsert({
        where: { userId: userId },
        update: { 
          role: 'cleaner', // Default role for employee
          updatedAt: new Date()
        },
        create: {
          userId: userId,
          role: 'cleaner', // Default role for employee
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

export async function fixUserNames() {
  try {
    // Find all users with the template literal issue
    const usersWithIssue = await prisma.user.findMany({
      where: {
        name: {
          contains: "Rs{"
        }
      }
    });

    
    // Get all users from Clerk to get their correct information
    const client = await clerkClient();
    let fixedCount = 0;

    for (const user of usersWithIssue) {
      try {
        if (!user.clerkId) continue;

        // Get user data from Clerk
        const clerkUser = await client.users.getUser(user.clerkId);
        
        // Create the correct name
        const firstName = clerkUser.firstName || '';
        const lastName = clerkUser.lastName || '';
        const correctName = `${firstName} ${lastName}`.trim();
        
        // Update the user in the database
        await prisma.user.update({
          where: { id: user.id },
          data: { 
            name: correctName 
          }
        });

        fixedCount++;
              } catch (err) {
        console.error(`Error fixing user ${user.id}:`, err);
      }
    }

    return { 
      success: true, 
      message: `Fixed ${fixedCount} out of ${usersWithIssue.length} user names` 
    };
  } catch (error) {
    console.error('Error fixing user names:', error);
    return { 
      success: false, 
      message: 'Failed to fix user names', 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

export async function updateUserProfile(data: {
  phoneNumber?: string;
  address?: string;
}) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(data.phoneNumber !== undefined && { phoneNumber: data.phoneNumber }),
        ...(data.address !== undefined && { address: data.address }),
        updatedAt: new Date(),
      }
    });

    return updatedUser;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw new Error('Failed to update user profile');
  }
}

export async function getUserProfile() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        address: true,
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw new Error('Failed to fetch user profile');
  }
} 