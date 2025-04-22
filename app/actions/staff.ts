"use server"
import prisma from "@/lib/db"

export type StaffWithUser = {
  id: string
  role: string
  averageRating: number
  totalReviews: number
  createdAt: Date
  updatedAt: Date
  user: {
    id: string
    name: string
    email: string
    phone: string | null
    profileImage: string | null
  }
  reviews?: {
    id: string
    rating: number
    comment: string | null
    createdAt: Date
    user: {
      name: string
      profileImage: string | null
    }
  }[]
}

export async function getStaff() {
  try {
    const staff = await prisma.staff.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            profileImage: true,
          },
        },
        reviews: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            user: {
              select: {
                name: true,
                profileImage: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return staff
  } catch (error) {
    console.error("Error fetching staff:", error)
    throw new Error("Failed to fetch staff members")
  }
}

export async function getStaffById(id: string) {
  try {
    const staff = await prisma.staff.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            profileImage: true,
          },
        },
        reviews: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            user: {
              select: {
                name: true,
                profileImage: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        appointments: {
          include: {
            service: true,
            user: true,
            vehicle: true,
          },
          orderBy: {
            date: "desc",
          },
        },
      },
    })

    if (!staff) {
      throw new Error("Staff member not found")
    }

    return staff
  } catch (error) {
    console.error("Error fetching staff member:", error)
    throw new Error("Failed to fetch staff member")
  }
}

export async function createStaffReview(staffId: string, userId: string, rating: number, comment?: string) {
  try {
    // Create the review
    const review = await prisma.staffReview.create({
      data: {
        staffId,
        userId,
        rating,
        comment,
      },
      include: {
        user: {
          select: {
            name: true,
            profileImage: true,
          },
        },
      },
    })

    // Update staff's average rating and total reviews
    const staff = await prisma.staff.findUnique({
      where: { id: staffId },
      include: {
        reviews: true,
      },
    })

    if (!staff) {
      throw new Error("Staff member not found")
    }

    const totalRating = staff.reviews.reduce((sum, review) => sum + review.rating, 0) + rating
    const newTotalReviews = staff.reviews.length + 1
    const newAverageRating = totalRating / newTotalReviews

    await prisma.staff.update({
      where: { id: staffId },
      data: {
        averageRating: newAverageRating,
        totalReviews: newTotalReviews,
      },
    })

    return review
  } catch (error) {
    console.error("Error creating staff review:", error)
    throw new Error("Failed to create staff review")
  }
}

export async function getEmployeeTasks(userId: string) {
  try {
    // First get the staff record for this user
    const staff = await prisma.staff.findFirst({
      where: { userId },
      select: { id: true }
    });

    if (!staff) {
      throw new Error('Staff member not found');
    }

    const tasks = await prisma.appointment.findMany({
      where: {
        staffId: staff.id,
        date: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
      include: {
        user: true,
        service: true,
        vehicle: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    return tasks;
  } catch (error) {
    console.error('Error fetching employee tasks:', error);
    throw new Error('Failed to fetch employee tasks');
  }
}

export async function getEmployeePerformance(userId: string) {
  try {
    // First get the staff record for this user
    const staff = await prisma.staff.findFirst({
      where: { userId },
      include: {
        reviews: {
          include: {
            user: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        },
      },
    });

    if (!staff) {
      throw new Error('Staff member not found');
    }

    const completedTasks = await prisma.appointment.count({
      where: {
        staffId: staff.id,
        status: 'COMPLETED',
        date: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
    });

    const totalTasks = await prisma.appointment.count({
      where: {
        staffId: staff.id,
        date: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
    });

    return {
      staff,
      completedTasks,
      totalTasks,
    };
  } catch (error) {
    console.error('Error fetching employee performance:', error);
    throw new Error('Failed to fetch employee performance');
  }
}

export async function updateTaskStatus(appointmentId: string, status: string) {
  try {
    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { status },
    });

    return appointment;
  } catch (error) {
    console.error('Error updating task status:', error);
    throw new Error('Failed to update task status');
  }
} 