// hooks/use-products.ts
"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

export const useProducts = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch("/api/products");
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        toast.error("Failed to fetch products.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const deleteProduct = async (id: string) => {
    try {
      await fetch(`/api/products/Rs{id}`, {
        method: "DELETE",
      });

      setProducts(products.filter((product) => product.id !== id));
      return true;
    } catch (error) {
      throw error;
    }
  };

  return {
    products,
    isLoading,
    deleteProduct,
  };
};
