"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPrice } from "@/lib/utils";
import {
  ArrowLeft,
  CalendarIcon,
  CreditCard,
  Mail,
  Phone,
  User,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: string | number;
  product: {
    id: string;
    name: string;
    description: string | null;
    images: string[];
  };
}

interface Payment {
  id: string;
  method: string;
  status: string;
  transactionId: string | null;
  amount: string | number;
  createdAt: string;
}

interface Order {
  id: string;
  userId: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  totalAmount: string | number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phoneNumber: string | null;
  };
  items: OrderItem[];
  payment: Payment | null;
  phoneNumber?: string;
  address?: string;
  description?: string;
}

// Status badge colors
const statusColors = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PAID: "bg-green-100 text-green-800",
  SHIPPED: "bg-blue-100 text-blue-800",
  DELIVERED: "bg-purple-100 text-purple-800",
  CANCELED: "bg-red-100 text-red-800",
  REFUNDED: "bg-gray-100 text-gray-800",
};

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [orderStatus, setOrderStatus] = useState("");

  const fetchOrderDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`);
      if (response.ok) {
        const data = await response.json();
        setOrder(data);
        setOrderStatus(data.status);
      } else {
        toast.error("Failed to fetch order details");
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
      toast.error("An error occurred while fetching order details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const updateOrderStatus = async () => {
    if (!order || orderStatus === order.status) return;

    setUpdating(true);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          status: orderStatus,
          sendNotification: true
        }),
      });

      if (response.ok) {
        toast.success("Order status updated successfully");
        fetchOrderDetails();
      } else {
        toast.error("Failed to update order status");
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("An error occurred while updating order status");
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <DashboardLayout userRole="admin">
        <div className="container mx-auto p-6">
          <div className="flex justify-center items-center min-h-[60vh]">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!order) {
    return (
      <DashboardLayout userRole="admin">
        <div className="container mx-auto p-6">
          <div className="text-center py-10">
            <h2 className="text-2xl font-bold mb-2">Order Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The order you are looking for does not exist.
            </p>
            <Button onClick={() => router.push("/dashboard/admin/orders")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Orders
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="admin">
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button
              variant="outline"
              size="sm"
              className="mr-4"
              onClick={() => router.push("/dashboard/admin/orders")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Orders
            </Button>
            <h1 className="text-2xl font-bold">Order Details</h1>
          </div>

          <div className="flex items-center gap-2">
            <Select value={orderStatus} onValueChange={setOrderStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Order Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="SHIPPED">Shipped</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
                <SelectItem value="CANCELED">Canceled</SelectItem>
                <SelectItem value="REFUNDED">Refunded</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={updateOrderStatus}
              disabled={updating || orderStatus === order.status}
            >
              {updating ? "Updating..." : "Update Status"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Order Summary */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
              <CardDescription>
                Order #{order.id.substring(0, 8)}...
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <div className="flex items-center">
                  <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(order.createdAt)}</span>
                </div>
                <Badge
                  variant="outline"
                  className={
                    (statusColors as any)[order.status] ||
                    "bg-gray-100 text-gray-800"
                  }
                >
                  {order.status}
                </Badge>
                <Badge
                  variant="outline"
                  className={
                    order.paymentStatus === "PAID" || order.paymentStatus === "SUCCESS"
                      ? "bg-green-100 text-green-800"
                      : order.paymentStatus === "PENDING"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                  }
                >
                  Payment: {order.paymentStatus}
                </Badge>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Products</h3>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {order.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.product.name}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatPrice(Number(item.price))}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatPrice(Number(item.price) * item.quantity)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex flex-col items-end">
                <div className="w-full max-w-xs">
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatPrice(Number(order.totalAmount))}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between py-2 font-medium">
                    <span>Total</span>
                    <span>{formatPrice(Number(order.totalAmount))}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer & Payment Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center">
                  <User className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{order.user.name}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{order.user.email}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{order.phoneNumber || order.user.phoneNumber || "Not provided"}</span>
                </div>

                <Separator className="my-2" />

                <div>
                  <h3 className="text-sm font-medium mb-1">Delivery Address:</h3>
                  <p className="text-sm">{order.address || "Not provided"}</p>
                </div>

                {order.description && (
                  <div>
                    <h3 className="text-sm font-medium mb-1">Additional Instructions:</h3>
                    <p className="text-sm text-muted-foreground">{order.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center">
                  <CreditCard className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>Method: {order.paymentMethod}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-muted-foreground mr-2">Status:</span>
                  <Badge
                    variant="outline"
                    className={
                      order.paymentStatus === "PAID" || order.paymentStatus === "SUCCESS"
                        ? "bg-green-100 text-green-800"
                        : order.paymentStatus === "PENDING"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                    }
                  >
                    {order.paymentStatus}
                  </Badge>
                </div>
                {order.payment?.transactionId && (
                  <div>
                    <span className="text-muted-foreground mr-2">
                      Transaction ID:
                    </span>
                    <code className="text-xs bg-muted p-1 rounded">
                      {order.payment.transactionId}
                    </code>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
