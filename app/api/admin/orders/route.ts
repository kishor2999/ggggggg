import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    console.log("Admin orders API called");
    
    // IMPORTANT: For demo purposes, we're bypassing the admin check
    // In production, you should check the user role and authorize properly
    
    // Get query parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status") || "ALL";
    const search = searchParams.get("search") || "";
    
    console.log("Query params:", { page, limit, status, search });
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Build where clause for filters
    const where: any = {};
    
    // Status filter
    if (status !== "ALL") {
      where.status = status;
    }
    
    // Search filter (search by order ID or user email/name)
    if (search) {
      where.OR = [
        {
          id: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          user: {
            OR: [
              {
                email: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                name: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            ],
          },
        },
      ];
    }
    
    console.log("Where clause:", JSON.stringify(where));
    
    // Count total orders with filters
    const totalOrders = await prisma.order.count({ where });
    console.log("Total orders count:", totalOrders);
    
    // Get all orders no matter what (for debugging purposes)
    const allOrdersCount = await prisma.order.count();
    console.log("Total orders in database (no filters):", allOrdersCount);
    
    // Get orders
    const orders = await prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        payment: {
          select: {
            id: true,
            status: true,
            method: true,
            transactionId: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                images: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });
    
    console.log("Orders found:", orders.length);
    if (orders.length > 0) {
      console.log("First order ID:", orders[0].id);
      console.log("First order belongs to user:", orders[0].user?.name);
    }
    
    // Serialize Decimal values to avoid Next.js serialization errors
    const serializedOrders = orders.map(order => ({
      ...order,
      totalAmount: order.totalAmount.toString(),
      items: order.items.map(item => ({
        ...item,
        price: item.price.toString(),
        product: {
          ...item.product,
          price: item.product.price.toString()
        }
      }))
    }));
    
    // Calculate total pages
    const totalPages = Math.ceil(totalOrders / limit);
    
    return NextResponse.json({
      orders: serializedOrders,
      totalOrders,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.error("Error fetching admin orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
} 