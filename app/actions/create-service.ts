"use server"

import prisma from "@/lib/db"
import { Prisma } from "@prisma/client";

export default async function CreateService(data: {
  name: string;
  description?: string;
  price: string; // Price should be passed as a string
  duration: number;
  features?: string[]; // Array of feature names
}) {

  console.log("data rache here", data)
  try {
    const newService = await prisma.service.create({
      data: {
        name: data.name,
        description: data.description || null,
        price: new Prisma.Decimal(data.price), 
        duration: data.duration,
        features: data.features
          ? {
              create: data.features.map((feature) => ({
                name: feature,
              })),
            }
          : undefined,
      },
      include: {
        features: true, // Include features in the returned object
      },
    });

    console.log('Service added:', newService);
    return {
      ...newService,
      price: newService.price.toString(), // Convert Decimal to string
    };
  } catch (error) {
    console.error('Error adding service:', error);
    throw new Error('Unable to add service');
  } 
}

