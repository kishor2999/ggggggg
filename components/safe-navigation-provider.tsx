"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

// Define the context type
type NavigationContextType = {
  pathname: string;
  navigate: (path: string) => void;
};

// Create context with default values
const NavigationContext = createContext<NavigationContextType>({
  pathname: "/",
  navigate: () => {},
});

// Hook to use navigation safely
export const useSafeNavigation = () => useContext(NavigationContext);

export function SafeNavigationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const [pathname, setPathname] = useState("/");

  useEffect(() => {
    // Set mounted state and initialize pathname
    setMounted(true);
    setPathname(window.location.pathname);

    // Listen for pathname changes
    const handleRouteChange = () => {
      setPathname(window.location.pathname);
    };

    // Use history API to track changes
    window.addEventListener("popstate", handleRouteChange);

    return () => {
      window.removeEventListener("popstate", handleRouteChange);
    };
  }, []);

  // Safe navigation function
  const navigate = (path: string) => {
    window.location.href = path;
  };

  // Only render when mounted on client
  if (!mounted) {
    return <div className="min-h-screen bg-background">{null}</div>;
  }

  return (
    <NavigationContext.Provider value={{ pathname, navigate }}>
      {children}
    </NavigationContext.Provider>
  );
} 