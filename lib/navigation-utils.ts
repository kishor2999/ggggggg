"use client";

import { useEffect, useState } from "react";

/**
 * A safe utility for getting the current pathname
 * with a fallback to window.location when Next.js context is not available
 */
export function useSafePathname(): string {
  const [pathname, setPathname] = useState("/");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      setPathname(window.location.pathname);
    } catch (error) {
      console.error("Error getting pathname:", error);
    }
  }, []);

  return pathname;
}

/**
 * A safe utility for navigation that falls back to window.location
 * when Next.js router is not available
 */
export function useSafeNavigation() {
  const navigate = (path: string) => {
    try {
      window.location.href = path;
    } catch (error) {
      console.error("Error navigating:", error);
    }
  };

  return { navigate };
}

/**
 * A simple function to get URL parameters safely
 */
export function getUrlParam(paramName: string): string | null {
  if (typeof window === "undefined") return null;
  
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get(paramName);
  } catch (error) {
    console.error("Error getting URL param:", error);
    return null;
  }
} 