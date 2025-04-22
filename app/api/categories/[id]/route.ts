import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if there are any products using this category
    const productsUsingCategory = await prisma.product.findFirst({
      where: {
        categoryId: params.id,
      },
    });

    if (productsUsingCategory) {
      return NextResponse.json(
        {
          error:
            "Cannot delete category because it has products. Please remove or reassign the products first.",
        },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({ message: "Category deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
} 