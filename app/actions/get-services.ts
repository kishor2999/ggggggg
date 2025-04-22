"use server"

import prisma from "@/lib/db"

export default async function GetServices() {
  try {
    const services = await prisma.service.findMany({
      include: {
        features: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Map the services to include features as an array of strings
    return services.map(service => ({
      ...service,
      price: service.price.toString(),
      features: service.features.map(feature => feature.name)
    }))
  } catch (error) {
    console.error('Error fetching services:', error)
    throw new Error('Unable to fetch services')
  }
} 