"use server"
import prisma from "@/lib/db"

export type EmployeeWithUser = {
  id: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
  // UI-specific fields
  status?: string;
  location?: string;
  schedule?: string;
  skills?: string[];
  notes?: string;
  user: {
    id: string;
    name: string;
    email: string;
    phoneNumber: string | null;
    profileImage: string | null;
  }
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