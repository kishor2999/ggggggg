"use server"

import prisma from "@/lib/db"
import { Prisma } from "@prisma/client"

export default async function UpdateService(data: {
  id: string
  name: string
  description?: string
  price: string
  duration: number
  features?: string[]
}) {
  try {
    // First, delete all existing features for this service
    await prisma.feature.deleteMany({
      where: {
        serviceId: data.id
      }
    })

    // Then update the service and create new features
    const updatedService = await prisma.service.update({
      where: {
        id: data.id
      },
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
        features: true,
      },
    })

    return {
      ...updatedService,
      price: updatedService.price.toString(),
    }
  } catch (error) {
    console.error('Error updating service:', error)
    throw new Error('Unable to update service')
  }
} 