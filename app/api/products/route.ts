import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
      },
    });
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, price, stock, categoryId, images } = body;

    // Ensure price is stored exactly as provided without rounding
    // Convert to string with toFixed(2) to ensure consistent decimal places
    const exactPrice = typeof price === 'number' ? price.toString() : String(price);

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: exactPrice, // Pass price as string to maintain precision
        stock,
        categoryId,
        images,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
} 