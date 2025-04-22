import ProductForm from "../../components/ProductForm";
import prisma from "@/lib/db";
import { notFound } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";

export default async function EditProductPage({
  params,
}: {
  params: { id: string };
}) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: {
      category: true,
    },
  });

  if (!product) {
    notFound();
  }

  const categories = await prisma.category.findMany();

  return (
    <DashboardLayout userRole="admin">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Edit Product</h1>
            <p className="text-muted-foreground">
              Update product details and settings
            </p>
          </div>
        </div>
        <ProductForm 
          initialData={{
            id: product.id,
            name: product.name,
            description: product.description || "",
            price: Number(product.price),
            stock: product.stock,
            categoryId: product.categoryId,
            images: product.images,
          }}
          categories={categories} 
        />
      </div>
    </DashboardLayout>
  );
} 