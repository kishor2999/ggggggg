"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Car, DollarSign, Calendar } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { formatCurrency, formatPercentage } from "@/lib/utils";

// Define types for our data
type DashboardStats = {
  totalRevenue: {
    amount: number;
    percentChange: number;
  };
  bookings: {
    count: number;
    percentChange: number;
  };
  activeCustomers: {
    count: number;
    percentChange: number;
  };
  servicesCompleted: {
    count: number;
    percentChange: number;
  };
};

type BookingItem = {
  id: string;
  customer: string;
  service: string;
  dateTime: string;
  employee: string | null;
  status: string;
  amount: number;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Fetch dashboard stats
        const statsResponse = await fetch('/api/dashboard/stats');
        const statsData = await statsResponse.json();
        
        // Fetch recent bookings
        const bookingsResponse = await fetch('/api/dashboard/recent-bookings');
        const bookingsData = await bookingsResponse.json();
        
        setStats(statsData);
        setRecentBookings(bookingsData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  // Status badge color mapping
  const getStatusBadgeClass = (status: string) => {
    const statusMap: Record<string, string> = {
      'PENDING': '',
      'IN_PROGRESS': 'bg-yellow-500',
      'COMPLETED': 'bg-green-500',
      'CANCELLED': 'bg-red-500',
      'SCHEDULED': '',
    };
    
    return statusMap[status] || '';
  };

  // Loading state
  if (loading) {
    return (
      <DashboardLayout userRole="admin">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          </div>
          <div className="h-96 flex items-center justify-center">
            <p>Loading dashboard data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="admin">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Revenue
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats && stats.totalRevenue ? formatCurrency(stats.totalRevenue.amount) : 'Rs0'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats && stats.totalRevenue ? `${formatPercentage(stats.totalRevenue.percentChange)} from last month` : '-'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Bookings
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats && stats.bookings ? stats.bookings.count : 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats && stats.bookings ? `${formatPercentage(stats.bookings.percentChange)} from last month` : '-'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Services Completed
                  </CardTitle>
                  <Car className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats && stats.servicesCompleted ? stats.servicesCompleted.count : 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats && stats.servicesCompleted ? `${formatPercentage(stats.servicesCompleted.percentChange)} from last month` : '-'}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Bookings</CardTitle>
                <CardDescription>
                  Overview of the latest bookings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentBookings.length > 0 ? (
                      recentBookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell className="font-medium">
                            {booking.customer}
                          </TableCell>
                          <TableCell>{booking.service}</TableCell>
                          <TableCell>{booking.dateTime}</TableCell>
                          <TableCell>{booking.employee || 'Unassigned'}</TableCell>
                          <TableCell>
                            <Badge className={getStatusBadgeClass(booking.status)}>
                              {booking.status.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(booking.amount)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">
                          No recent bookings found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
