import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    // Get recent appointments with relationships
    const recentAppointments = await prisma.appointment.findMany({
      take: 5,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: true,
        service: true,
                employee: {          include: {            user: true,          },        },
      },
    });

    // Format the data for the frontend
    const formattedBookings = recentAppointments.map((appointment) => {
      // Format date
      const appointmentDate = new Date(appointment.date);
      const formattedDate = new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(appointmentDate);

      // Format status to match UI expectations
      const statusMap: Record<string, string> = {
        "PENDING": "PENDING",
        "CONFIRMED": "SCHEDULED",
        "IN_PROGRESS": "IN_PROGRESS",
        "COMPLETED": "COMPLETED",
        "CANCELLED": "CANCELLED",
      };

      return {
        id: appointment.id,
        customer: appointment.user.name,
        service: appointment.service.name,
        dateTime: formattedDate,
        employee: appointment.employee?.user.name || null,
        status: statusMap[appointment.status] || appointment.status,
        amount: Number(appointment.price),
      };
    });

    return NextResponse.json(formattedBookings);
  } catch (error) {
    console.error("Error fetching recent bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch recent bookings" },
      { status: 500 }
    );
  }
} 