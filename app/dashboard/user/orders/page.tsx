"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import { Package, ShoppingBag, AlertCircle, Truck, RefreshCw } from "lucide-react";

interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number | string;
  createdAt: string;
  updatedAt: string;
  product: {
    id: string;
    name: string;
    price: number | string;
    images: string[];
  };
}

interface Order {
  id: string;
  userId: string;
  totalAmount: number | string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  transactionId: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Function to fetch orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      
            const response = await fetch("/api/orders/user", {
        // Add cache: 'no-store' to prevent caching
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }
      
      const data = await response.json();
            
      // Sort orders with most recent first
      const sortedOrders = data.sort((a: Order, b: Order) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      
      // Log details of each order for debugging
      sortedOrders.forEach((order: Order) => {
              });
      
      setOrders(sortedOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  // Add force refresh button for debugging/testing
  const handleRefresh = () => {
    fetchOrders();
    toast.info("Refreshing orders...");
  };

  useEffect(() => {
    // Always show payment success message when the page loads from a redirect
    // after payment completion
    const showSuccessToast = () => {
      toast.success('Payment completed successfully! Your order has been processed.', {
        duration: 5000,
      });
    };
    
    // Show success toast with a slight delay for better UX
    const timer = setTimeout(showSuccessToast, 500);

    // Fetch orders initially
    fetchOrders();
    
    // Clean up the timer when component unmounts
    return () => clearTimeout(timer);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "PENDING":
        return <Badge variant="outline">Pending</Badge>;
      case "PROCESSING":
        return <Badge variant="secondary">Processing</Badge>;
      case "SHIPPED":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Shipped</Badge>;
      case "DELIVERED":
        return <Badge variant="default" className="bg-green-100 text-green-800">Delivered</Badge>;
      case "CANCELLED":
        return <Badge variant="destructive">Cancelled</Badge>;
      case "PAID":
        return <Badge variant="default">Paid</Badge>;
      case "SUCCESS":
        return <Badge variant="default" className="bg-green-100 text-green-800">Paid</Badge>;
      case "FAILED":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <DashboardLayout userRole="user">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">My Orders</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={() => router.push("/dashboard/user/products")}>
              <ShoppingBag className="mr-2 h-4 w-4" />
              Continue Shopping
            </Button>
          </div>
        </div>
        
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-24 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-8 text-center">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No completed orders found</h3>
            <p className="text-muted-foreground">
              You don't have any successfully paid orders yet. Orders will appear here after payment is completed.
            </p>
            <Button className="mt-4" onClick={() => router.push("/dashboard/user/products")}>
              Browse Products
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg">Order #{order.id.slice(0, 8)}</CardTitle>
                      <CardDescription>Placed on {formatDate(order.createdAt)}</CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="flex items-center">
                        <span className="text-sm font-medium mr-2">Payment:</span>
                        {getStatusBadge(order.paymentStatus)}
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm font-medium mr-2">Status:</span>
                        {getStatusBadge(order.status)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="hidden md:table-cell">Price</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {order.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.product.name}</TableCell>
                          <TableCell className="hidden md:table-cell">{formatPrice(Number(item.product.price))}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell className="text-right">{formatPrice(Number(item.price) * item.quantity)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-t pt-4">
                  <div>
                    <p className="text-sm font-medium">Payment Method: {order.paymentMethod}</p>
                    {order.transactionId && (
                      <p className="text-xs text-muted-foreground">
                        Transaction ID: {order.transactionId}
                      </p>
                    )}
                  </div>
                  <div className="text-right mt-2 sm:mt-0">
                    <p className="text-sm font-medium">Total</p>
                    <p className="text-xl font-bold">{formatPrice(Number(order.totalAmount))}</p>
                  </div>
                </CardFooter>
                {(order.status === "PENDING" || order.status === "PROCESSING") && order.paymentStatus === "SUCCESS" && (
                  <div className="px-6 pb-4">
                    <div className="bg-blue-50 p-4 rounded-md flex items-start">
                      <Truck className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-blue-800">Your order is being processed</h4>
                        <p className="text-sm text-blue-600 mt-1">
                          We've received your payment and are preparing your order for shipment.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 