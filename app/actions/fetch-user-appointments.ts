"use server"

import prisma from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export default async function fetchUserAppointments (){
    // Get userId from query params (you may use clerkId or userId, depending on your app logic)
    const { userId } = await auth()

    if (!userId) {
        throw new Error("Missing clerk id")
    }

    try {
        const user = await prisma.user.findUnique({
            where: { clerkId: userId }, // or use userId depending on your authentication logic
            include: {
                appointments: {
                    include: {
                        service: true, // Include service data (name, description, etc.)
                        vehicle: true, // Include vehicle data (type, model, plate)
                    },
                },
            },
        });

        if (!user) {
            throw new Error("User not found")
        }

        // Convert Decimal objects to strings to avoid serialization issues
        const serializedAppointments = user.appointments.map(appointment => ({
            ...appointment,
            price: appointment.price.toString(),
            service: {
                ...appointment.service,
                price: appointment.service.price.toString()
            }
        }));

        return serializedAppointments;
    } catch (error) {
        throw new Error("Something went wrong")
    }
}
