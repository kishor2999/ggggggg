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
  try {
    // Convert price from string to Prisma.Decimal
    const price = new Prisma.Decimal(data.price);
    
    // Create the service first
    const newService = await prisma.service.create({
      data: {
        name: data.name,
        description: data.description,
        price: price,
        duration: data.duration,
      }
    });
    
    // If features are provided, create them
    if (data.features && data.features.length > 0) {
      await prisma.feature.createMany({
        data: data.features.map(name => ({
          name,
          serviceId: newService.id
        }))
      });
    }
    
    return {
      ...newService,
      price: newService.price.toString(), // Convert Decimal to string
    };
  } catch (error) {
    console.error('Error adding service:', error);
    throw new Error('Unable to add service');
  } 
}

