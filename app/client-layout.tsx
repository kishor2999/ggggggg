"use client";

import { useState, useEffect } from "react";
import { SafeNavigationProvider } from "@/components/safe-navigation-provider";

export default function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isMounted, setIsMounted] = useState(false);
    
    // Safely access client-side only features
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Don't render anything until client-side hydration is complete
    if (!isMounted) {
        return <div className="min-h-screen bg-background"></div>;
    }

    // Wrap all children in the safe navigation provider
    return (
        <SafeNavigationProvider>
            <div className="min-h-screen bg-background">
                {children}
            </div>
        </SafeNavigationProvider>
    );
} 