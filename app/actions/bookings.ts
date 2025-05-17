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

// Add a helper function to normalize time slot format (same as in appointments.ts)
function normalizeTimeSlot(timeSlot: string): string {
  // If already in 24-hour format, return as is
  if (timeSlot.match(/^\d{1,2}:\d{2}$/)) {
    return timeSlot;
  }
  
  // Convert from 12-hour to 24-hour format
  const matches = timeSlot.match(/(\d+):(\d+)\s?(AM|PM|am|pm)/i);
  if (matches) {
    const [_, hourStr, minuteStr, periodStr] = matches;
    let hour = parseInt(hourStr);
    const minute = parseInt(minuteStr);
    const period = periodStr.toUpperCase();
    
    if (period === "PM" && hour < 12) hour += 12;
    if (period === "AM" && hour === 12) hour = 0;
    
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  }
  
  // If couldn't parse, return original
  console.warn(`Couldn't normalize time slot format: ${timeSlot}`);
  return timeSlot;
}

// Helper function to format time slot from 24-hour to 12-hour format
function formatTimeSlot(timeSlot: string): string {
  // If already in 12-hour format, return as is
  if (timeSlot.match(/(\d+):(\d+)\s?(AM|PM|am|pm)/i)) {
    return timeSlot;
  }
  
  // Convert from 24-hour to 12-hour format
  if (timeSlot.match(/^\d{1,2}:\d{2}$/)) {
    const [hourStr, minuteStr] = timeSlot.split(':');
    let hour = parseInt(hourStr);
    const minute = parseInt(minuteStr);
    const period = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    if (hour === 0) hour = 12;
    return `${hour}:${minute.toString().padStart(2, '0')} ${period}`;
  }
  
  // If couldn't parse, return original
  return timeSlot;
}

// Add a function to check time slot availability for a given date
export async function getTimeSlotAvailability(date: Date) {
  try {
    // Format the date to remove time component for comparison
    const bookingDate = new Date(date);
    bookingDate.setHours(0, 0, 0, 0);
    
    // Set the end of the day for date range query
    const endOfDay = new Date(bookingDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all active appointments for the given date
    const appointments = await prisma.appointment.findMany({
      where: {
        date: {
          gte: bookingDate,
          lte: endOfDay,
        },
        // Only count active appointments
        status: {
          in: ['PENDING', 'SCHEDULED', 'IN_PROGRESS']
        }
      },
      select: {
        timeSlot: true,
      }
    });

    // Count appointments per time slot
    const timeSlotsCount: Record<string, number> = {};
    
    // Initialize with zero count
    appointments.forEach(appointment => {
      const timeSlot = appointment.timeSlot;
      timeSlotsCount[timeSlot] = (timeSlotsCount[timeSlot] || 0) + 1;
      
      // Also add the 12-hour format version of this time slot for compatibility
      try {
        // If the time slot is in 24-hour format, add a 12-hour format entry
        if (timeSlot.match(/^\d{1,2}:\d{2}$/)) {
          const formattedTimeSlot = formatTimeSlot(timeSlot);
          timeSlotsCount[formattedTimeSlot] = timeSlotsCount[timeSlot];
        } 
        // If the time slot is in 12-hour format, add a 24-hour format entry
        else if (timeSlot.match(/(\d+):(\d+)\s?(AM|PM|am|pm)/i)) {
          const normalizedTimeSlot = normalizeTimeSlot(timeSlot);
          timeSlotsCount[normalizedTimeSlot] = timeSlotsCount[timeSlot];
        }
      } catch (e) {
        console.error("Error adding alternative time format:", e);
      }
    });

 
    
    return timeSlotsCount;
  } catch (error) {
    console.error('Error fetching time slot availability:', error);
    throw new Error('Failed to check time slot availability');
  }
} 