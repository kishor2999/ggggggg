"use server"

import prisma from "@/lib/db"

export default async function DeleteService(serviceId: string) {
  try {
    // First delete all features associated with the service
    await prisma.feature.deleteMany({
      where: {
        serviceId: serviceId
      }
    })

    // Then delete the service
    await prisma.service.delete({
      where: {
        id: serviceId
      }
    })

    return { success: true }
  } catch (error) {
    console.error('Error deleting service:', error)
    throw new Error('Unable to delete service')
  }
} 