"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Package, ShoppingBag } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { formatPrice } from "@/lib/utils";

interface OrderDetails {
  id: string;
  totalAmount: number;
  reference?: string;
}

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Clear the cart when payment is successful
  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') return;
    
        
    // Clear the cart
        try {
      clearCart();
          } catch (error) {
      console.error("Error clearing cart:", error);
    }
    
    // First, properly handle the full URL to extract parameters correctly
    // This will fix the issue with malformed URLs containing multiple question marks
    
    // Get the full raw URL
    const fullUrl = window.location.href;
        
    // Check if we need to clear the cart (from query param)
    const shouldClearCart = searchParams?.get("clear_cart") === "true";
    if (shouldClearCart) {
            clearCart();
    }
    
    // Extract order_id before any second question mark
    let id = null;
    const orderIdMatch = fullUrl.match(/order_id=([^?&]+)/);
    if (orderIdMatch && orderIdMatch[1]) {
      id = orderIdMatch[1];
          } else {
      // Fallback to searchParams
      id = searchParams?.get("order_id");
          }
    
    // Extract reference if it exists
    const reference = searchParams.get("reference");
    
    // Extract any encoded data (could be after a second question mark)
    const dataMatch = fullUrl.match(/[?&]data=([^&]+)/);
    const encodedData = dataMatch ? dataMatch[1] : null;
        
    if (id) {
      setOrderDetails({
        id,
        totalAmount: 0,
        reference: reference || undefined
      });
      
      // Fetch order details if we have an ID
      const fetchOrderDetails = async () => {
        try {
                    const response = await fetch(`/api/orders/${id}`);
          if (response.ok) {
            const data = await response.json();
            setOrderDetails({
              id: data.id,
              totalAmount: data.totalAmount,
              reference: reference || undefined
            });
          } else {
            console.error(`Failed to fetch order: ${response.status}`);
          }
        } catch (error) {
          console.error("Failed to fetch order details:", error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchOrderDetails();
    } else {
      setLoading(false);
    }
    
    // Redirect to orders page after 5 seconds
    const timer = setTimeout(() => {
      if (typeof window !== "undefined") {
        window.location.href = "/dashboard/user/orders";
      }
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [clearCart, router, searchParams]);

  // Define safe navigation functions
  const navigateToOrders = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/dashboard/user/orders";
    }
  };

  const navigateToShopping = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/dashboard/user/products";
    }
  };

  return (
    <DashboardLayout userRole="user">
      <div className="container mx-auto py-10 max-w-md">
        <Card className="text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl">Order Confirmed!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Thank you for your purchase! Your order has been successfully placed and payment has been completed.
            </p>
            
            {orderDetails && (
              <div className="bg-gray-50 p-4 rounded-lg my-4">
                <div className="flex items-center justify-center mb-3">
                  <Package className="h-5 w-5 text-primary mr-2" />
                  <h3 className="font-medium">Order Details</h3>
                </div>
                <p className="text-sm mb-1">
                  <span className="font-medium">Order ID:</span> {orderDetails.id.slice(0, 8)}...
                </p>
                {orderDetails.totalAmount > 0 && (
                  <p className="text-sm mb-1">
                    <span className="font-medium">Amount:</span> {formatPrice(orderDetails.totalAmount)}
                  </p>
                )}
                {orderDetails.reference && (
                  <p className="text-sm">
                    <span className="font-medium">Reference:</span> {orderDetails.reference}
                  </p>
                )}
              </div>
            )}
            
            <p className="mt-4 text-muted-foreground">
              You will be redirected to your orders page in a few seconds, or you can view your orders now.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4">
            <Button 
              onClick={navigateToOrders} 
              className="w-full sm:w-auto"
            >
              View My Orders
            </Button>
            <Button 
              variant="outline" 
              onClick={navigateToShopping} 
              className="w-full sm:w-auto"
            >
              <ShoppingBag className="mr-2 h-4 w-4" />
              Continue Shopping
            </Button>
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  );
} 