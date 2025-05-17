"use client";

import ProductForm from "./ProductForm";

interface Category {
    id: string;
    name: string;
}

interface ProductFormWrapperProps {
    initialData?: {
        id?: string;
        name: string;
        description: string;
        price: number;
        stock: number;
        categoryId: string;
        images: string[];
    };
    categories: Category[];
}

export default function ProductFormWrapper({
    initialData,
    categories
}: ProductFormWrapperProps) {
    return <ProductForm initialData={initialData} categories={categories} />;
} 