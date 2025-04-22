"use client";

import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function PaymentFailure() {
  const router = useRouter();

  return (
    <DashboardLayout userRole="user">
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Payment Failed</CardTitle>
            <CardDescription className="text-center">
              Your payment could not be processed
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center space-y-4">
            <AlertTriangle className="h-16 w-16 text-amber-500" />
            
            <p className="text-center">
              The payment was not completed or was cancelled. Your booking has not been confirmed.
            </p>
            
            <div className="flex flex-col w-full gap-2">
              <Button 
                onClick={() => router.push("/dashboard/user/book")}
                variant="default"
              >
                Try Again
              </Button>
              
              <Button 
                onClick={() => router.push("/dashboard/user/bookings")}
                variant="outline"
              >
                View Your Bookings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 