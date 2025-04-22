"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";

// Map database status to UI status
const mapStatus = (dbStatus: string): string => {
  switch (dbStatus.toUpperCase()) {
    case "PENDING":
      return "scheduled";
    case "IN_PROGRESS":
      return "in-progress";
    case "COMPLETED":
      return "completed";
    default:
      return dbStatus.toLowerCase();
  }
};

export async function getEmployeeTasks(userId: string) {
  try {
    console.log("Fetching tasks for user ID:", userId);

    // First, let's check if the user exists
    const user = await prisma.user.findFirst({
      where: {
        clerkId: userId,
      },
    });

    if (!user) {
      console.log("User not found with clerkId:", userId);
      throw new Error("User not found");
    }

    console.log("Found user:", user.id);

    // Find the staff member associated with the user
    const staff = await prisma.staff.findFirst({
      where: {
        userId: user.id,
      },
      include: {
        appointments: {
          include: {
            service: true,
            vehicle: {
              include: {
                user: true,
              },
            },
            user: true,
          },
          orderBy: {
            date: "asc",
          },
        },
      },
    });

    if (!staff) {
      console.log("Staff member not found for user:", user.id);
      throw new Error("Staff member not found");
    }

    console.log("Found staff member:", staff.id);
    console.log("Number of appointments:", staff.appointments.length);

    // Log each appointment's details

    // Transform appointments into tasks
    const tasks = staff.appointments.map((appointment) => {
      // Create a properly formatted Date for frontend use
      const scheduledTime = new Date(appointment.date);

      return {
        id: appointment.id,
        service: appointment.service.name,
        customer: {
          name: appointment.user.name,
          email: appointment.user.email,
          phone: appointment.user.phone || "",
          notes: appointment.notes || "",
          rating: 0,
        },
        vehicle: {
          make: appointment.vehicle.type,
          model: appointment.vehicle.model,
          color: "Unknown",
          licensePlate: appointment.vehicle.plate,
        },
        scheduledTime,
        estimatedDuration: appointment.service.duration,
        status: mapStatus(appointment.status),
        location: "Downtown Branch",
        assignedBy: "System",
        specialInstructions: appointment.notes || "",
        completedAt:
          appointment.status === "COMPLETED"
            ? new Date(appointment.updatedAt)
            : undefined,
        feedback: "",
      };
    });

    return tasks;
  } catch (error) {
    console.error("Error fetching employee tasks:", error);
    throw error;
  }
}

export async function updateTaskStatus(
  taskId: string,
  status: string,
  completionNotes?: string
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Map UI status back to database status
    const mapToDbStatus = (uiStatus: string): string => {
      switch (uiStatus.toLowerCase()) {
        case "scheduled":
          return "PENDING";
        case "in-progress":
          return "IN_PROGRESS";
        case "completed":
          return "COMPLETED";
        default:
          return uiStatus.toUpperCase();
      }
    };

    console.log(
      `Updating task Rs{taskId} status to Rs{status} (DB status: Rs{mapToDbStatus(status)})`
    );

    // Update the appointment status
    const updatedAppointment = await prisma.appointment.update({
      where: {
        id: taskId,
        staff: {
          user: {
            clerkId: userId,
          },
        },
      },
      data: {
        status: mapToDbStatus(status),
        notes: completionNotes
          ? `Rs{completionNotes}\nRs{new Date().toISOString()}`
          : undefined,
      },
    });

    console.log("Appointment updated:", updatedAppointment);
    revalidatePath("/dashboard/employee/tasks");
    return updatedAppointment;
  } catch (error) {
    console.error("Error updating task status:", error);
    throw error;
  }
}
