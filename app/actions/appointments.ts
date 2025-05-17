"use server"
import prisma from '@/lib/db';
import { auth } from '@clerk/nextjs/server';
import { EVENT_TYPES, getAdminChannel, getDateAvailabilityChannel, getUserChannel, pusherServer } from '@/lib/pusher';

// Add a helper function to normalize time slot format
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

// Add this function to check if a time slot is already at capacity
async function isTimeSlotAtCapacity(date: Date, timeSlot: string) {
  // Normalize the time slot to 24-hour format for consistent database queries
  const normalizedTimeSlot = normalizeTimeSlot(timeSlot);
  
  // Format the date to remove time component for comparison
  const bookingDate = new Date(date);
  bookingDate.setHours(0, 0, 0, 0);
  
  // Set the end of the day for date range query
  const endOfDay = new Date(bookingDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Count how many appointments already exist for this date and time slot
  const existingAppointments = await prisma.appointment.count({
    where: {
      date: {
        gte: bookingDate,
        lte: endOfDay,
      },
      timeSlot: normalizedTimeSlot,
      // Only count active appointments
      status: {
        in: ['PENDING', 'SCHEDULED', 'IN_PROGRESS']
      }
    }
  });

  console.log(`Found ${existingAppointments} existing appointments for ${bookingDate.toDateString()} at ${normalizedTimeSlot} (original: ${timeSlot})`);
  
  // Return true if we already have 2 or more appointments for this time slot
  return existingAppointments >= 2;
}

export async function createAppointment(data: {
  serviceId: string;
  vehicleId: string;
  date: Date;
  timeSlot: string;
  notes?: string;
  paymentMethod: string;
  paymentType?: 'FULL' | 'HALF';
}) {
  try {
    const { userId, sessionClaims } = await auth();
    
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Define metadata type
    type UserMetadata = {
      role?: "customer" | "employee" | "admin";
    };

    // Get user role from session claims
    const metadata = (sessionClaims?.metadata as UserMetadata) || {};
    const role = metadata.role;

    // Check if user is admin and prevent appointment creation
    if (role === "admin") {
      throw new Error('Administrators cannot book appointments');
    }

    // Normalize the time slot format for consistent storage
    const normalizedTimeSlot = normalizeTimeSlot(data.timeSlot);
    console.log(`Time slot normalized from ${data.timeSlot} to ${normalizedTimeSlot}`);

    // CHECK CAPACITY: Check if this time slot is already at capacity (2 appointments)
    const isAtCapacity = await isTimeSlotAtCapacity(data.date, normalizedTimeSlot);
    if (isAtCapacity) {
      throw new Error('This time slot is already fully booked. Please select a different time.');
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    }); 

    if (!user) {
      throw new Error('User not found');
    }

    const service = await prisma.service.findUnique({
      where: { id: data.serviceId }
    });

    if (!service) {
      throw new Error('Service not found');
    }

    // Determine payment status based on payment method and type
    let paymentStatus = 'PENDING';
    
    // Only ESEWA is available as payment method
    if (data.paymentMethod === 'ESEWA') {
      // Will be updated after payment verification
      paymentStatus = 'PENDING';
    }

    const appointment = await prisma.appointment.create({
      data: {
        userId: user.id,
        serviceId: data.serviceId,
        vehicleId: data.vehicleId,
        date: data.date,
        timeSlot: normalizedTimeSlot,
        notes: data.notes,
        price: service.price,
        paymentMethod: data.paymentMethod,
        paymentType: data.paymentType || "FULL",
        status: 'SCHEDULED',
        paymentStatus: paymentStatus,
        needsEmployeeAssignment: true,
        phoneNumber: user.phoneNumber || "0000000000",
      },
      include: {
        service: true,
        vehicle: true,
      }
    });

    // Format date for notification messages
    const formattedDate = new Date(data.date).toLocaleDateString();
    
    // After creating the appointment, notify about updated slot availability 
    // Get the date channel for availability updates
    const dateChannel = getDateAvailabilityChannel(data.date);
    
    // Get updated availability for this date
    const bookingDate = new Date(data.date);
    bookingDate.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(bookingDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all active appointments for this date
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
    
    appointments.forEach(appointment => {
      const timeSlot = appointment.timeSlot;
      timeSlotsCount[timeSlot] = (timeSlotsCount[timeSlot] || 0) + 1;
    });

    // Emit event with updated availability
    console.log(`Sending availability update to channel: ${dateChannel}`);
    await pusherServer.trigger(
      dateChannel,
      EVENT_TYPES.TIMESLOT_AVAILABILITY_UPDATED,
      {
        date: bookingDate.toISOString(),
        timeSlotsCount,
        updatedAt: new Date().toISOString()
      }
    );

    // Create notification for the user
    const userNotification = await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Booking Scheduled',
        message: `Your booking for ${service.name} on ${formattedDate} at ${data.timeSlot} has been scheduled.`,
        type: 'BOOKING',
        isRead: false
      }
    });

    // Trigger Pusher event for the user using correct channel format
    console.log(`Sending booking notification to user channel: ${getUserChannel(user.id)}`);
    await pusherServer.trigger(
      getUserChannel(user.id), 
      EVENT_TYPES.NEW_NOTIFICATION, 
      {
        id: userNotification.id,
        title: userNotification.title,
        message: userNotification.message,
        type: userNotification.type,
        createdAt: userNotification.createdAt,
        isRead: userNotification.isRead
      }
    );

    // Also send to user-db channel for compatibility (if your app uses both)
    if (user.clerkId) {
      await pusherServer.trigger(
        `user-db-${user.clerkId}`, 
        EVENT_TYPES.NEW_NOTIFICATION, 
        {
          id: userNotification.id,
          title: userNotification.title,
          message: userNotification.message,
          type: userNotification.type,
          createdAt: userNotification.createdAt,
          isRead: userNotification.isRead
        }
      );
    }

    // Get admin users to notify them
    const adminUsers = await prisma.user.findMany({
      where: {
        OR: [
          { role: 'ADMIN' },
          { role: 'admin' },
          { role: { contains: 'ADMIN', mode: 'insensitive' } }
        ]
      }
    });

    console.log(`Found ${adminUsers.length} admin users to notify about new booking`);
    
    if (adminUsers.length === 0) {
      console.log("WARNING: No admin users found in the database to notify!");
      console.log("Creating a debug notification for troubleshooting");
      
      // Try to find admin users with a more relaxed query
      const allUsers = await prisma.user.findMany();
      console.log(`Total users in the system: ${allUsers.length}`);
      console.log(`User roles in the system: ${allUsers.map(u => u.role).join(', ')}`);
      
      // Look for admins with case-insensitive search
      const possibleAdmins = allUsers.filter(u => 
        u.role.toUpperCase() === 'ADMIN' || 
        u.role.toUpperCase().includes('ADMIN')
      );
      
      if (possibleAdmins.length > 0) {
        console.log(`Found ${possibleAdmins.length} possible admin users with non-exact role match`);
        console.log(`Possible admin roles: ${possibleAdmins.map(u => u.role).join(', ')}`);
      }
    }

    // Create notification for all admins
    for (const admin of adminUsers) {
      console.log(`Creating notification for admin: ${admin.id}, name: ${admin.name}, role: ${admin.role}`);
      
      try {
        const adminNotification = await prisma.notification.create({
          data: {
            userId: admin.id,
            title: 'New Booking Scheduled',
            message: `${user.name} has scheduled a ${service.name} service for ${formattedDate} at ${data.timeSlot}.`,
            type: 'BOOKING',
            isRead: false
          }
        });
        
        console.log(`Created admin notification (ID: ${adminNotification.id}) for admin: ${admin.id}`);

        // Send to admin's personal channel using the correct channel format
        if (admin.clerkId) {
          console.log(`Admin has clerkId: ${admin.clerkId}, sending to channel: ${getUserChannel(admin.clerkId)}`);
          await pusherServer.trigger(
            getUserChannel(admin.clerkId), 
            EVENT_TYPES.NEW_NOTIFICATION, 
            {
              id: adminNotification.id,
              title: adminNotification.title,
              message: adminNotification.message,
              type: adminNotification.type,
              createdAt: adminNotification.createdAt,
              isRead: adminNotification.isRead
            }
          );
          
          // Also send to admin-db channel for compatibility
          console.log(`Also sending to admin-db channel: user-db-${admin.clerkId}`);
          await pusherServer.trigger(
            `user-db-${admin.clerkId}`, 
            EVENT_TYPES.NEW_NOTIFICATION, 
            {
              id: adminNotification.id,
              title: adminNotification.title,
              message: adminNotification.message,
              type: adminNotification.type,
              createdAt: adminNotification.createdAt,
              isRead: adminNotification.isRead
            }
          );
        } else {
          console.warn(`Admin ${admin.id} does not have a clerkId, cannot send push notification`);
        }
      } catch (error) {
        console.error(`Error creating notification for admin ${admin.id}:`, error);
      }
    }

    // Also trigger a general admin channel notification
    console.log(`Sending notification to general admin channel: ${getAdminChannel()}`);
    await pusherServer.trigger(
      getAdminChannel(), 
      EVENT_TYPES.NEW_NOTIFICATION, 
      {
        title: 'New Booking Scheduled',
        message: `New ${service.name} service scheduled by ${user.name} for ${formattedDate}`,
        timestamp: new Date().toISOString(),
        appointmentId: appointment.id
      }
    );

    return appointment;
  } catch (error) {
    console.error('Error creating appointment:', error);
    throw new Error('Failed to create appointment');
  }
}

export async function updateAppointment(
  appointmentId: string,
  data: {
    serviceId?: string;
    vehicleId?: string;
    date?: Date;
    timeSlot?: string;
    notes?: string;
    status?: string;
    employeeId?: string | null;
    paymentStatus?: string;
    paymentType?: string;
  }
) {
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

    // Get the current appointment to compare changes
    const currentAppointment = await prisma.appointment.findUnique({
      where: { id: appointmentId }
    });

    if (!currentAppointment) {
      throw new Error('Appointment not found');
    }

    // Normalize the time slot if provided
    let normalizedTimeSlot: string | undefined;
    if (data.timeSlot) {
      normalizedTimeSlot = normalizeTimeSlot(data.timeSlot);
      console.log(`Update time slot normalized from ${data.timeSlot} to ${normalizedTimeSlot}`);
    }

    // Check if we're rescheduling (changing date or time)
    const isRescheduling = 
      (data.date && data.date.toString() !== currentAppointment.date.toString()) ||
      (normalizedTimeSlot && normalizedTimeSlot !== currentAppointment.timeSlot);

    // If rescheduling, check capacity for the new time slot
    if (isRescheduling && data.date && normalizedTimeSlot) {
      // Don't count the current appointment when checking capacity
      const bookingDate = new Date(data.date);
      bookingDate.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(bookingDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Count other appointments for this time slot
      const existingAppointments = await prisma.appointment.count({
        where: {
          id: { not: appointmentId }, // Exclude the current appointment
          date: {
            gte: bookingDate,
            lte: endOfDay,
          },
          timeSlot: normalizedTimeSlot,
          // Only count active appointments
          status: {
            in: ['PENDING', 'SCHEDULED', 'IN_PROGRESS']
          }
        }
      });

      console.log(`Found ${existingAppointments} existing appointments for the new time slot`);
      
      // Check if the new time slot is at capacity
      if (existingAppointments >= 2) {
        throw new Error('This time slot is already fully booked. Please select a different time.');
      }
    }

    let price;
    if (data.serviceId) {
      const service = await prisma.service.findUnique({
        where: { id: data.serviceId }
      });
      if (service) {
        price = service.price;
      }
    }

    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        ...(data.serviceId && { serviceId: data.serviceId }),
        ...(data.vehicleId && { vehicleId: data.vehicleId }),
        ...(data.date && { date: data.date }),
        ...(normalizedTimeSlot && { timeSlot: normalizedTimeSlot }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.status && { status: data.status }),
        ...(data.employeeId !== undefined && { employeeId: data.employeeId }),
        ...(data.paymentStatus && { paymentStatus: data.paymentStatus }),
        ...(data.paymentType && { paymentType: data.paymentType }),
        ...(price && { price }),
        updatedAt: new Date(),
      },
      include: {
        service: true,
        vehicle: true,
        employee: true,
        user: true,
      }
    });

    // If the appointment was rescheduled or cancelled, update availability for both dates
    if (isRescheduling || (data.status && data.status === 'CANCELLED')) {
      // Get dates that need availability updates
      const datesToUpdate = new Set<string>();
      
      // Add the original appointment date
      const originalDate = new Date(currentAppointment.date);
      datesToUpdate.add(originalDate.toISOString().split('T')[0]);
      
      // If rescheduling, add the new date
      if (data.date) {
        const newDate = new Date(data.date);
        datesToUpdate.add(newDate.toISOString().split('T')[0]);
      }
      
      // Update availability for each affected date
      for (const dateStr of datesToUpdate) {
        const updateDate = new Date(dateStr);
        updateDate.setHours(0, 0, 0, 0);
        
        const updateEndOfDay = new Date(updateDate);
        updateEndOfDay.setHours(23, 59, 59, 999);
        
        // Get all active appointments for this date
        const dateAppointments = await prisma.appointment.findMany({
          where: {
            date: {
              gte: updateDate,
              lte: updateEndOfDay,
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
        const updatedTimeSlotsCount: Record<string, number> = {};
        
        dateAppointments.forEach(appt => {
          const timeSlot = appt.timeSlot;
          updatedTimeSlotsCount[timeSlot] = (updatedTimeSlotsCount[timeSlot] || 0) + 1;
        });
        
        // Emit event with updated availability
        const dateChannel = getDateAvailabilityChannel(updateDate);
        console.log(`Sending availability update to channel: ${dateChannel}`);
        
        await pusherServer.trigger(
          dateChannel,
          EVENT_TYPES.TIMESLOT_AVAILABILITY_UPDATED,
          {
            date: updateDate.toISOString(),
            timeSlotsCount: updatedTimeSlotsCount,
            updatedAt: new Date().toISOString()
          }
        );
      }
    }

    return appointment;
  } catch (error) {
    console.error('Error updating appointment:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to update appointment');
  }
} 