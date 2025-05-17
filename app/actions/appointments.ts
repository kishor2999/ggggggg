"use server"
import prisma from '@/lib/db';
import { auth } from '@clerk/nextjs/server';

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
        status: 'PENDING',
        paymentStatus: paymentStatus,
        needsEmployeeAssignment: true,
        phoneNumber: user.phoneNumber || "0000000000",
      },
      include: {
        service: true,
        vehicle: true,
      }
    });

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