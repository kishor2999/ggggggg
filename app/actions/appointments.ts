"use server"
import prisma from '@/lib/db';
import { auth } from '@clerk/nextjs/server';
import { EVENT_TYPES, getAdminChannel, getUserChannel, pusherServer } from '@/lib/pusher';

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
        timeSlot: data.timeSlot,
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
        ...(data.timeSlot && { timeSlot: data.timeSlot }),
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

    return appointment;
  } catch (error) {
    console.error('Error updating appointment:', error);
    throw new Error('Failed to update appointment');
  }
} 