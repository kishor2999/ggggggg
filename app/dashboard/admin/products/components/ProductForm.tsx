"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import Image from "next/image";
import { Loader2 } from "lucide-react";

const { useUploadThing } = generateReactHelpers<OurFileRouter>();

interface Category {
  id: string;
  name: string;
}

interface ProductFormProps {
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

export default function ProductForm({
  initialData,
  categories,
}: ProductFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    price: initialData?.price ?? 0,
    stock: initialData?.stock || 0,
    categoryId: initialData?.categoryId || "",
    images: initialData?.images || [],
  });

  // Use a separate state for price input
  const [priceInput, setPriceInput] = useState(initialData?.price ? initialData.price.toString() : "0");
  const [isPriceEmpty, setIsPriceEmpty] = useState(false);

  const { startUpload, isUploading } = useUploadThing("imageUploader");

  // Ensure price state is properly synchronized when component initializes
  useEffect(() => {
    if (initialData?.price) {
      setPriceInput(initialData.price.toString());
      setFormData(prevData => ({
        ...prevData,
        price: initialData.price
      }));
    }
  }, [initialData]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    try {
      const uploadedFiles = await startUpload(Array.from(e.target.files));
      if (uploadedFiles) {
        const newImages = uploadedFiles.map((file) => file.url);
        setFormData({
          ...formData,
          images: [...formData.images, ...newImages],
        });
        toast.success("Images uploaded successfully");
      }
    } catch (error) {
      toast.error("Failed to upload images");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const endpoint = initialData?.id
        ? `/api/products/${initialData.id}`
        : "/api/products";
      const method = initialData?.id ? "PUT" : "POST";

      // Ensure price is properly converted to a number
      const formDataToSend = {
        ...formData,
        price: Number(formData.price)
      };

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formDataToSend),
      });

      if (!response.ok) {
        throw new Error("Failed to save product");
      }

      toast.success(
        initialData?.id
          ? "Product updated successfully"
          : "Product created successfully"
      );
      router.push("/dashboard/admin/products");
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
        />
      </div>

      <div>
        <Label htmlFor="price">Price</Label>
        <Input
          id="price"
          type="text"
          inputMode="decimal"
          value={priceInput}
          onFocus={() => {
            if (priceInput === "0") {
              setPriceInput("");
              setIsPriceEmpty(true);
            }
          }}
          onBlur={() => {
            if (priceInput === "") {
              setPriceInput("0");
              setFormData({
                ...formData,
                price: 0
              });
            }
            setIsPriceEmpty(false);
          }}
          onChange={(e) => {
            const value = e.target.value;
            // Only set numeric values or empty string
            if (value === '' || /^\d*\.?\d*$/.test(value)) {
              setPriceInput(value);
              setIsPriceEmpty(value === '');
              setFormData({
                ...formData,
                price: value === '' ? 0 : Number(value)
              });
            }
          }}
          required
        />
      </div>

      <div>
        <Label htmlFor="stock">Stock</Label>
        <Input
          id="stock"
          type="number"
          value={formData.stock}
          onChange={(e) =>
            setFormData({ ...formData, stock: parseInt(e.target.value) })
          }
          required
        />
      </div>

      <div>
        <Label htmlFor="category">Category</Label>
        <Select
          value={formData.categoryId}
          onValueChange={(value) =>
            setFormData({ ...formData, categoryId: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Images</Label>
        <div className="mt-2 space-y-4">
          <div className="flex flex-wrap gap-4">
            {formData.images.map((image, index) => (
              <div key={index} className="relative">
                <Image
                  src={image}
                  alt={`Product image ${index + 1}`}
                  width={100}
                  height={100}
                  className="rounded-md"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-0 right-0"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      images: formData.images.filter((_, i) => i !== index),
                    })
                  }
                >
                  X
                </Button>
              </div>
            ))}
          </div>
          <div>
            <div className="space-y-2">
              <div className="relative">
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className={isUploading ? "opacity-70" : ""}
                />
                {isUploading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                )}
              </div>
              {isUploading ? (
                <p className="text-xs text-primary font-medium">
                  Uploading files... Please wait
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Upload product images (max 10 images, 4MB each)
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={isLoading || isUploading}>
          {isLoading
            ? "Saving..."
            : initialData?.id
              ? "Update Product"
              : "Create Product"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard/admin/products")}
          disabled={isUploading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
