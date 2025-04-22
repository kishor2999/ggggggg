import { NextResponse } from "next/server";
import prisma from "@/lib/db";

// PATCH /api/appointments/[id]
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { id } = params;

    if (!id) {
      return new NextResponse("Appointment ID is required", { status: 400 });
    }

    // Update the appointment with the provided data
    const appointment = await prisma.appointment.update({
      where: {
        id: id,
      },
      data: {
        ...body,
      },
    });

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("[APPOINTMENT_PATCH]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// GET /api/appointments/[id]
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return new NextResponse("Appointment ID is required", { status: 400 });
    }

    const appointment = await prisma.appointment.findUnique({
      where: {
        id: id,
      },
      include: {
        service: true,
        vehicle: true,
      },
    });

    if (!appointment) {
      return new NextResponse("Appointment not found", { status: 404 });
    }

    return NextResponse.json(appointment);
  } catch (error) {
    console.error("[APPOINTMENT_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 