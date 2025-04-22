import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    // Get current date and one month ago
    const currentDate = new Date();
    const firstDayThisMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const firstDayLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    const lastDayLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);

    // Calculate total revenue - include all payment statuses
    const currentMonthRevenue = await prisma.payment.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        createdAt: {
          gte: firstDayThisMonth,
        },
      },
    });

    const lastMonthRevenue = await prisma.payment.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        createdAt: {
          gte: firstDayLastMonth,
          lt: firstDayThisMonth,
        },
      },
    });

    // Calculate bookings
    const currentMonthBookings = await prisma.appointment.count({
      where: {
        createdAt: {
          gte: firstDayThisMonth,
        },
      },
    });

    const lastMonthBookings = await prisma.appointment.count({
      where: {
        createdAt: {
          gte: firstDayLastMonth,
          lt: firstDayThisMonth,
        },
      },
    });

    // Calculate active customers
    const currentMonthCustomers = await prisma.user.count({
      where: {
        role: "CUSTOMER",
        appointments: {
          some: {
            createdAt: {
              gte: firstDayThisMonth,
            },
          },
        },
      },
    });

    const lastMonthCustomers = await prisma.user.count({
      where: {
        role: "CUSTOMER",
        appointments: {
          some: {
            createdAt: {
              gte: firstDayLastMonth,
              lt: firstDayThisMonth,
            },
          },
        },
      },
    });

    // Calculate services completed
    const currentMonthServices = await prisma.appointment.count({
      where: {
        status: "COMPLETED",
        createdAt: {
          gte: firstDayThisMonth,
        },
      },
    });

    const lastMonthServices = await prisma.appointment.count({
      where: {
        status: "COMPLETED",
        createdAt: {
          gte: firstDayLastMonth,
          lt: firstDayThisMonth,
        },
      },
    });

    // Calculate percentage changes
    const currentRevenueTotal = currentMonthRevenue._sum.amount ? Number(currentMonthRevenue._sum.amount) : 0;
    const lastRevenueTotal = lastMonthRevenue._sum.amount ? Number(lastMonthRevenue._sum.amount) : 0;
    const revenuePercentChange = lastRevenueTotal === 0 
      ? 100 
      : ((currentRevenueTotal - lastRevenueTotal) / lastRevenueTotal) * 100;

    const bookingsPercentChange = lastMonthBookings === 0 
      ? 100 
      : ((currentMonthBookings - lastMonthBookings) / lastMonthBookings) * 100;

    const customersPercentChange = lastMonthCustomers === 0 
      ? 100 
      : ((currentMonthCustomers - lastMonthCustomers) / lastMonthCustomers) * 100;

    const servicesPercentChange = lastMonthServices === 0 
      ? 100 
      : ((currentMonthServices - lastMonthServices) / lastMonthServices) * 100;

    // Prepare response data
    const stats = {
      totalRevenue: {
        amount: currentRevenueTotal,
        percentChange: revenuePercentChange,
      },
      bookings: {
        count: currentMonthBookings,
        percentChange: bookingsPercentChange,
      },
      activeCustomers: {
        count: currentMonthCustomers,
        percentChange: customersPercentChange,
      },
      servicesCompleted: {
        count: currentMonthServices,
        percentChange: servicesPercentChange,
      },
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard statistics" },
      { status: 500 }
    );
  }
} 