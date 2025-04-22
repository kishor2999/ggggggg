"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function PaymentSuccess() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [paymentType, setPaymentType] = useState("carwash"); // Default to carwash

  // Fix for hydration issues - only run client-side code after mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Only run verification after component is mounted on client
    if (!isClient) return;

    const encodedResponse = searchParams.get("data");
    if (!encodedResponse) {
      setVerifying(false);
      setSuccess(false);
      setMessage("No payment data found");
      return;
    }

    const verifyPayment = async () => {
      try {
        // Get the payment type from URL if available
        const type = searchParams.get("type") || "carwash";
        setPaymentType(type);
        
        // Log the data being sent for verification
        console.log("Sending payment data for verification:", { encodedResponse, paymentType: type });
        
        const response = await fetch("/api/esewa/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            encodedResponse,
            paymentType: type
          }),
        });

        const result = await response.json();
        console.log("Verification result:", result);
        
        if (result.success) {
          setSuccess(true);
          setMessage("Payment completed successfully!");
          toast.success("Payment verified successfully");
          
          // Update payment type from the result if available
          if (result.paymentType) {
            setPaymentType(result.paymentType);
          }
          
          // Use a delayed redirection to avoid context issues
          setTimeout(() => {
            // Redirect based on payment type
            if (result.paymentType === "ecommerce" || result.payment?.orderId) {
              router.push("/dashboard/user/orders");
            } else {
              router.push("/dashboard/user/bookings");
            }
          }, 2000); // Slightly longer delay to ensure context is ready
        } else {
          setSuccess(false);
          setMessage(result.message || "Failed to verify payment");
          toast.error(result.message || "Failed to verify payment");
        }
      } catch (error) {
        console.error("Error verifying payment:", error);
        setSuccess(false);
        setMessage("An error occurred while verifying payment");
        toast.error("An error occurred while verifying payment");
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [searchParams, router, isClient]);

  // Return a simple loading state until client-side code runs
  if (!isClient) {
    return (
      <DashboardLayout userRole="user">
        <div className="flex flex-col items-center justify-center min-h-[70vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="user">
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Payment {verifying ? "Processing" : success ? "Successful" : "Failed"}</CardTitle>
            <CardDescription className="text-center">
              {verifying ? "Please wait while we verify your payment..." : success ? 
                paymentType === "ecommerce" ? "Redirecting to your orders..." : "Redirecting to your bookings..." 
                : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center space-y-4">
            {verifying ? (
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            ) : success ? (
              <CheckCircle className="h-16 w-16 text-green-500" />
            ) : (
              <AlertCircle className="h-16 w-16 text-red-500" />
            )}
            
            <p className="text-center">{message}</p>
            
            {!verifying && !success && (
              <div className="flex flex-col w-full gap-2">
                {paymentType === "ecommerce" ? (
                  <>
                    <Button 
                      onClick={() => router.push("/dashboard/user/orders")}
                      variant="outline"
                    >
                      Return to Orders
                    </Button>
                    
                    <Button 
                      onClick={() => router.push("/dashboard/user/products")}
                      variant="default"
                    >
                      Continue Shopping
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      onClick={() => router.push("/dashboard/user/bookings")}
                      variant="outline"
                    >
                      Return to Bookings
                    </Button>
                    
                    <Button 
                      onClick={() => router.push("/dashboard/user/book")}
                      variant="default"
                    >
                      Try Booking Again
                    </Button>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 