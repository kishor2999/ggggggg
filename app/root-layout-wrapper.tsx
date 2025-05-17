"use client";

import React, { useState, useEffect } from "react";

// Root wrapper component to provide safe client-side rendering
export function RootLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show minimal UI until client-side hydration completes
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background">
        {/* Loading placeholder */}
      </div>
    );
  }

  return <>{children}</>;
} 