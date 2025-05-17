"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import fetchUserPayments from "@/app/actions/fetch-user-payments";
import { toast } from "sonner";
import { Search, CreditCard, ShoppingCart, Car } from "lucide-react";

interface Payment {
    id: string;
    amount: string;
    status: string;
    method: string;
    transactionId: string | null;
    createdAt: Date;
    updatedAt: Date;
    order: Order | null;
    appointment: Appointment | null;
}

interface Order {
    id: string;
    totalAmount: string;
    status: string;
    paymentStatus: string;
}

interface Appointment {
    id: string;
    date: Date;
    timeSlot: string;
    price: string;
    service: {
        id: string;
        name: string;
        price: string;
    };
}

export default function PaymentsPage() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const loadPayments = async () => {
            try {
                setLoading(true);
                const data = await fetchUserPayments();
                setPayments(data);
            } catch (error) {
                console.error("Error loading payments:", error);
                toast.error("Failed to load payment history");
            } finally {
                setLoading(false);
            }
        };

        loadPayments();
    }, []);

    const filteredPayments = payments.filter((payment) => {
        const searchLower = searchQuery.toLowerCase();

        // Search by transaction ID
        if (payment.transactionId && payment.transactionId.toLowerCase().includes(searchLower)) {
            return true;
        }

        // Search by payment method
        if (payment.method.toLowerCase().includes(searchLower)) {
            return true;
        }

        // Search by order/service details
        if (payment.order && payment.order.id.toLowerCase().includes(searchLower)) {
            return true;
        }

        if (payment.appointment && payment.appointment.service.name.toLowerCase().includes(searchLower)) {
            return true;
        }

        return false;
    });

    const formatDate = (date: Date) => {
        return format(new Date(date), "PPP");
    };

    const getPaymentStatusBadge = (status: string) => {
        switch (status.toUpperCase()) {
            case "SUCCESS":
                return <Badge className="bg-green-500">Success</Badge>;
            case "PENDING":
                return <Badge variant="outline">Pending</Badge>;
            case "FAILED":
                return <Badge variant="destructive">Failed</Badge>;
            case "REFUNDED":
                return <Badge variant="secondary">Refunded</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getPaymentTypeIcon = (payment: Payment) => {
        if (payment.order) {
            return <ShoppingCart className="h-4 w-4 text-orange-500" />;
        } else if (payment.appointment) {
            return <Car className="h-4 w-4 text-blue-500" />;
        } else {
            return <CreditCard className="h-4 w-4 text-gray-500" />;
        }
    };

    const getPaymentDescription = (payment: Payment) => {
        if (payment.order) {
            return "Product Order";
        } else if (payment.appointment) {
            return payment.appointment.service.name;
        } else {
            return "Other Payment";
        }
    };

    return (
        <DashboardLayout userRole="user">
            <div className="container mx-auto p-6">
                <h1 className="text-2xl font-bold mb-6">Payment History</h1>

                <div className="flex items-center gap-2 mb-6">
                    <Search className="h-5 w-5 text-muted-foreground" />
                    <Input
                        placeholder="Search payments..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="max-w-md"
                    />
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>All Payments</CardTitle>
                        <CardDescription>
                            View your past payments for services and products
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                                <p className="mt-4 text-muted-foreground">Loading payments...</p>
                            </div>
                        ) : payments.length === 0 ? (
                            <div className="text-center py-8">
                                <CreditCard className="h-16 w-16 text-muted-foreground mx-auto" />
                                <p className="mt-4 text-muted-foreground">No payment history found</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Method</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredPayments.map((payment) => (
                                        <TableRow key={payment.id}>
                                            <TableCell>{formatDate(payment.createdAt)}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {getPaymentTypeIcon(payment)}
                                                    <span>{payment.order ? "Order" : "Service"}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {getPaymentDescription(payment)}
                                            </TableCell>
                                            <TableCell className="capitalize">{payment.method.toLowerCase()}</TableCell>
                                            <TableCell>{getPaymentStatusBadge(payment.status)}</TableCell>
                                            <TableCell className="text-right font-medium">
                                                Rs{Number(payment.amount).toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
} 