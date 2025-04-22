"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";
import { useCart } from "@/hooks/use-cart";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import { EsewaPaymentForm } from "@/app/components/EsewaPaymentForm";
import { v4 as uuidv4 } from "uuid";
import { createEsewaFormData } from "@/lib/esewa-utils";

// Define interface for eSewa payment data
interface EsewaPaymentData {
  payment_id: string;
  transaction_uuid: string;
  product_code: string;
  total_amount: number;
  signature: string;
  signed_field_names: string;
}

// Define CartItem interface
interface CartItem {
  id: string;
  quantity: number;
  price: number;
}

// eSewa testing environment URL
const ESEWA_FORM_URL = "https://rc-epay.esewa.com.np/api/epay/main/v2/form";
// Production URL: 'https://epay.esewa.com.np/api/epay/main/v2/form'

export default function CheckoutPage() {
  const { items, clearCart } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [esewaParams, setEsewaParams] = useState<any>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [orderId, setOrderId] = useState<string>("");
  const router = useRouter();

  // Calculate totals
  const subtotal = items.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);
  const total = subtotal;

  useEffect(() => {
    // Only redirect if cart is empty and we're not in the middle of payment processing
    if (items.length === 0 && !processingPayment) {
      router.push("/dashboard/user/cart");
    }
  }, [items.length, router, processingPayment]);

  // Initialize payment
  const initializePayment = async () => {
    setIsLoading(true);
    setProcessingPayment(true);

    try {
      // Generate a unique transaction ID
      const transactionUuid = uuidv4().replace(/[^a-zA-Z0-9-]/g, ''); // Ensure only alphanumeric and hyphens
      
      if (items.length === 0) {
        toast.error("Your cart is empty");
        setIsLoading(false);
        setProcessingPayment(false);
        return;
      }

      // Prepare order data
      const requestData = {
        items: items.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          price: item.price,
        })),
        totalAmount: total,
        status: "PENDING",
        paymentMethod: "ESEWA",
        paymentStatus: "PENDING",
        transactionId: transactionUuid, // Store the transaction ID for verification later
      };

      console.log("Creating order with data:", requestData);

      // Create temporary order
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Order creation failed:", response.status, errorData);
        throw new Error(`Failed to create order: ${errorData.error || response.statusText}`);
      }

      const orderData = await response.json();
      console.log("Order created:", orderData);
      const orderId = orderData.id;
      setOrderId(orderId);

      // Create eSewa form data according to documentation
      const origin = window.location.origin;
      
      // Use clean URLs as required by eSewa documentation
      const successUrl = `${origin}/api/payments/esewa/success`;
      const failureUrl = `${origin}/dashboard/user/orders/failed`;

      // Save order ID in transactionId to retrieve it later
      await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transactionId: transactionUuid }),
      });

      // Generate eSewa form data using the library function
      const esewaParams = createEsewaFormData(
        total,
        transactionUuid,
        successUrl,
        failureUrl,
        orderId // Pass the order ID for reference
      );

      console.log("eSewa payment parameters:", esewaParams);
      setEsewaParams(esewaParams);
      setShowPaymentForm(true);
    } catch (error) {
      console.error("Error initializing payment:", error);
      toast.error(`Failed to initialize payment: ${error instanceof Error ? error.message : "Unknown error"}`);
      setIsLoading(false);
      setProcessingPayment(false);
    }
  };

  return (
    <DashboardLayout userRole="user">
      <div className="container mx-auto p-6 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Checkout</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Order Summary */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
                <CardDescription>
                  Review your items before payment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-2"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 relative rounded-md overflow-hidden bg-muted">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="object-cover w-full h-full"
                          />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Qty: {item.quantity} × {formatPrice(item.price)}
                        </p>
                      </div>
                    </div>
                    <div className="font-medium">
                      {formatPrice(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Payment Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
                <CardDescription>Complete your purchase</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={initializePayment}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                      Processing...
                    </>
                  ) : (
                    "Pay with eSewa"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
      
      {/* eSewa Payment Form - Exact same pattern as in book page */}
      {showPaymentForm && esewaParams && (
        <EsewaPaymentForm 
          params={esewaParams} 
          onPaymentInitiated={() => {
            toast.info("Redirecting to eSewa payment gateway...");
          }}
        />
      )}
    </DashboardLayout>
  );
} 