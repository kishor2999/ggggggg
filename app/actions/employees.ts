"use server"
import prisma from "@/lib/db"

export type EmployeeWithUser = {
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
    phoneNumber: string | null
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

export async function getEmployees() {
  try {
    const employees = await prisma.employee.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
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

    // Process employees to ensure user data consistency
    const processedEmployees = employees.map(employee => {
      if (!employee.user) {
        // Provide default user data if missing
        return {
          ...employee,
          user: {
            id: 'unknown',
            name: `Employee ${employee.id.substring(0, 5)}`,
            email: '',
            phoneNumber: null,
            profileImage: null
          }
        };
      }
      return employee;
    });

    return processedEmployees;
  } catch (error) {
    console.error("Error fetching employees:", error);
    // Return empty array instead of throwing error
    return [];
  }
}

export async function getEmployeeById(id: string) {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
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

    if (!employee) {
      throw new Error("Employee not found")
    }

    return employee
  } catch (error) {
    console.error("Error fetching employee:", error)
    throw new Error("Failed to fetch employee")
  }
}

export async function createEmployeeReview(employeeId: string, userId: string, rating: number, comment?: string) {
  try {
    // Create the review
    const review = await prisma.employeeReview.create({
      data: {
        employeeId,
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

    // Update employee's average rating and total reviews
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        reviews: true,
      },
    })

    if (!employee) {
      throw new Error("Employee member not found")
    }

    const totalRating = employee.reviews.reduce((sum, review) => sum + review.rating, 0) + rating
    const newTotalReviews = employee.reviews.length + 1
    const newAverageRating = totalRating / newTotalReviews

    await prisma.employee.update({
      where: { id: employeeId },
      data: {
        averageRating: newAverageRating,
        totalReviews: newTotalReviews,
      },
    })

    return review
  } catch (error) {
    console.error("Error creating employee review:", error)
    throw new Error("Failed to create employee review")
  }
}

export async function getEmployeeTasks(userId: string) {
  try {
    // First get the employee record for this user
    const employee = await prisma.employee.findFirst({
      where: { userId },
      select: { id: true }
    });

    if (!employee) {
      throw new Error('Employee member not found');
    }

    const tasks = await prisma.appointment.findMany({
      where: {
        employeeId: employee.id,
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
    // First get the employee record for this user
    const employee = await prisma.employee.findFirst({
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

    if (!employee) {
      throw new Error('Employee member not found');
    }

    const completedTasks = await prisma.appointment.count({
      where: {
        employeeId: employee.id,
        status: 'COMPLETED',
        date: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
    });

    const totalTasks = await prisma.appointment.count({
      where: {
        employeeId: employee.id,
        date: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lt: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
    });

    return {
      employee,
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