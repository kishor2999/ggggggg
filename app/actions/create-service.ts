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

  
        return {
      ...newService,
      price: newService.price.toString(), // Convert Decimal to string
    };
  } catch (error) {
    console.error('Error adding service:', error);
    throw new Error('Unable to add service');
  } 
}

