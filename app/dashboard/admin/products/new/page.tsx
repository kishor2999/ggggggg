import ProductForm from "../components/ProductForm";
import prisma from "@/lib/db";
import { DashboardLayout } from "@/components/dashboard-layout";

export default async function NewProductPage() {
  const categories = await prisma.category.findMany();

  return (
    <DashboardLayout userRole="admin">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Add New Product</h1>
            <p className="text-muted-foreground">
              Create a new product for your catalog
            </p>
          </div>
        </div>
        <ProductForm categories={categories} />
      </div>
    </DashboardLayout>
  );
} 