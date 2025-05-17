"use server"
import prisma from '@/lib/db';
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

export async function getBookings() {
  try {
    const bookings = await prisma.appointment.findMany({
      include: {
        user: true,
        service: true,
        vehicle: true,
        employee: {
          include: {
            user: true
          }
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Safely serialize the bookings data
    return serializeData(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    throw new Error('Failed to fetch bookings');
  }
} 