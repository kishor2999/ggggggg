"use server";
import prisma from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function getServices() {
  try {
    const services = await prisma.service.findMany({
      include: {
        features: true,
      },
    });

    // Transform the data to match the frontend format
    return services.map((service) => ({
      id: service.id,
      name: service.name,
      price: Number(service.price),
      duration: service.duration.toString(),
      description: service.description || "",
      features: service.features.map((feature) => feature.name),
    }));
  } catch (error) {
    console.error("Error fetching services:", error);
    throw new Error("Failed to fetch services");
  }
}

export async function createService(data: {
  name: string;
  description: string;
  price: string;
  duration: string;
  features: string[];
}) {
  try {
    // Validate required fields
    if (!data.name || !data.price || !data.duration) {
      throw new Error("Name, price, and duration are required");
    }

    // Convert price to Decimal and duration to number
    const price = parseFloat(data.price);
    const duration = parseInt(data.duration);

    if (isNaN(price) || price <= 0) {
      throw new Error("Invalid price");
    }

    if (isNaN(duration) || duration <= 0) {
      throw new Error("Invalid duration");
    }

    // Create the service
    const service = await prisma.service.create({
      data: {
        name: data.name,
        description: data.description,
        price: price,
        duration: duration,
        features: {
          create: data.features.map((feature) => ({
            name: feature,
          })),
        },
      },
      include: {
        features: true,
      },
    });

    return {
      id: service.id,
      name: service.name,
      price: Number(service.price),
      duration: `Rs{service.duration} min`,
      description: service.description || "",
      features: service.features.map((feature) => feature.name),
    };
  } catch (error) {
    console.error("Error creating service:", error);
    throw new Error("Failed to create service");
  }
}
