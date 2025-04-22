"use server"
import prisma from '@/lib/db';

export async function getBookings() {
  try {
    const bookings = await prisma.appointment.findMany({
      include: {
        user: true,
        service: true,
        vehicle: true,
        staff: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    return bookings;
  } catch (error) {
    console.error('Error fetching bookings:', error);
    throw new Error('Failed to fetch bookings');
  }
} 