"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { XCircle } from "lucide-react";

export default function PaymentFailedPage() {
  const [isClient, setIsClient] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [errorReason, setErrorReason] = useState<string>("");

  // Use useEffect to ensure we're on the client side before using router/window
  useEffect(() => {
    setIsClient(true);
    // Get error reason from URL if available
    const reason = searchParams?.get("reason") || "unknown";
    setErrorReason(reason);
  }, [searchParams]);

  // Define safe navigation functions
  const navigateToCheckout = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/dashboard/user/checkout";
    }
  };

  const navigateToCart = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/dashboard/user/cart";
    }
  };

  return (
    <DashboardLayout userRole="user">
      <div className="container mx-auto py-10 max-w-md">
        <Card className="text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <XCircle className="h-16 w-16 text-red-500" />
            </div>
            <CardTitle className="text-2xl">Payment Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Unfortunately, your payment could not be processed. Please try again or choose a different payment method.
            </p>
            {errorReason && errorReason !== "unknown" && (
              <p className="mt-2 text-sm text-red-500">
                Reason: {errorReason.replace(/_/g, " ")}
              </p>
            )}
          </CardContent>
          <CardFooter className="flex justify-center space-x-4">
            <Button onClick={navigateToCheckout}>
              Try Again
            </Button>
            <Button variant="outline" onClick={navigateToCart}>
              Return to Cart
            </Button>
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  );
} 