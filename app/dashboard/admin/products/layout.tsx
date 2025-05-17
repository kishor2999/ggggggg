"use client";

import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { generateReactHelpers } from "@uploadthing/react";

const { useUploadThing } = generateReactHelpers<OurFileRouter>();

export default function ProductsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div>
            {children}
        </div>
    );
} 