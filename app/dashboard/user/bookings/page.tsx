"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Calendar,
  Car,
  Clock,
  Download,
  FileText,
  Filter,
  Pencil,
  Search,
  X,
} from "lucide-react";
import { format } from "date-fns";
import fetchUserAppointments from "@/app/actions/fetch-user-appointments";
import { toast } from "sonner";

// Sample booking data

// const bookings = [
//   {
//     id: "B001",
//     service: "Deluxe Wash",
//     vehicle: "Tesla Model 3",
//     date: new Date(2023, 4, 15, 14, 30),
//     status: "completed",
//     price: 69.99,
//     employee: "Mike Johnson",
//     location: "Downtown Branch",
//     notes: "Customer requested extra attention to wheels",
//     receipt: "INV-2023-05-15-001",
//   },
//   {
//     id: "B002",
//     service: "Interior Clean",
//     vehicle: "Tesla Model 3",
//     date: new Date(2023, 3, 28, 10, 0),
//     status: "completed",
//     price: 39.99,
//     employee: "Lisa Smith",
//     location: "Downtown Branch",
//     notes: "",
//     receipt: "INV-2023-04-28-003",
//   },
//   {
//     id: "B003",
//     service: "Premium Wash",
//     vehicle: "Honda Accord",
//     date: new Date(2023, 3, 10, 15, 30),
//     status: "completed",
//     price: 49.99,
//     employee: "John Miller",
//     location: "Westside Branch",
//     notes: "",
//     receipt: "INV-2023-04-10-007",
//   },
//   {
//     id: "B004",
//     service: "Full Detail",
//     vehicle: "Tesla Model 3",
//     date: new Date(2023, 5, 5, 13, 0),
//     status: "scheduled",
//     price: 129.99,
//     employee: "Lisa Smith",
//     location: "Downtown Branch",
//     notes: "New car preparation",
//     receipt: "",
//   },
//   {
//     id: "B005",
//     service: "Basic Wash",
//     vehicle: "Honda Accord",
//     date: new Date(2023, 5, 12, 11, 30),
//     status: "scheduled",
//     price: 24.99,
//     employee: "To be assigned",
//     location: "Westside Branch",
//     notes: "",
//     receipt: "",
//   },
// ]

export default function BookingHistory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const appointments = await fetchUserAppointments();
        console.log("Bookings loaded:", appointments.map(app => ({
          id: app.id,
          status: app.status,
          paymentStatus: app.paymentStatus,
          paymentType: app.paymentType
        })));
        setBookings(appointments);
      } catch (error) {
        console.error("Error fetching bookings:", error);
        toast.error("Failed to fetch bookings");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const upcomingBookings = bookings
    .filter((booking) => {
      const bookingDate = new Date(booking.date);
      const now = new Date();
      // Only show PENDING bookings that are in the future
      return booking.status === "PENDING" && bookingDate > now;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const pastBookings = bookings
    .filter((booking) => {
      const bookingDate = new Date(booking.date);
      const now = new Date();
      // Show COMPLETED bookings or PENDING bookings that are in the past
      return (
        booking.status === "COMPLETED" ||
        (booking.status === "PENDING" && bookingDate <= now)
      );
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredUpcomingBookings = upcomingBookings.filter(
    (booking) =>
      booking.service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.vehicle.model.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPastBookings = pastBookings.filter(
    (booking) =>
      booking.service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.vehicle.model.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewDetails = (booking: any) => {
    setSelectedBooking(booking);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge className="bg-green-500">Completed</Badge>;
      case "PENDING":
        return <Badge>Scheduled</Badge>;
      case "CANCELLED":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string, paymentType: string) => {
    // Add debugging
    console.log("Payment status badge:", { status, paymentType });

    // Normalize the values to handle case sensitivity issues
    const normalizedStatus = status?.toUpperCase() || '';
    const normalizedPaymentType = paymentType?.toUpperCase() || '';

    if (normalizedStatus === "PAID" || normalizedStatus === "SUCCESS") {
      if (normalizedPaymentType === "HALF") {
        return <Badge className="bg-yellow-500">Half Paid</Badge>;
      }
      return <Badge className="bg-green-500">Fully Paid</Badge>;
    }

    switch (normalizedStatus) {
      case "HALF_PAID":
        return <Badge className="bg-yellow-500">Half Paid</Badge>;
      case "PENDING":
        return <Badge variant="outline">Pending</Badge>;
      case "FAILED":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <DashboardLayout userRole="user">
        <div className="flex items-center justify-center h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading bookings...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="user">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">My Bookings</h1>
          <Button asChild>
            <a href="/dashboard/user/book">
              <Calendar className="mr-2 h-4 w-4" />
              Book New Service
            </a>
          </Button>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search bookings..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-9 w-9"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Clear search</span>
              </Button>
            )}
          </div>
        </div>

        <Tabs defaultValue="upcoming" className="space-y-4">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past Bookings</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Appointments</CardTitle>
                <CardDescription>
                  Your scheduled car wash appointments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredUpcomingBookings.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <Calendar className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">
                      No upcoming bookings
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {searchQuery
                        ? "No bookings match your search criteria."
                        : "You don't have any upcoming car wash appointments."}
                    </p>
                    {!searchQuery && (
                      <Button className="mt-4" asChild>
                        <a href="/dashboard/user/book">Book a Service</a>
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Service</TableHead>
                          <TableHead>Vehicle</TableHead>
                          <TableHead>Date & Time</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Payment</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUpcomingBookings.map((booking) => (
                          <TableRow key={booking.id}>
                            <TableCell className="font-medium">
                              {booking.service.name}
                            </TableCell>
                            <TableCell>{booking.vehicle.model}</TableCell>
                            <TableCell>
                              {format(
                                new Date(booking.date),
                                "MMM d, yyyy"
                              )} at {booking.timeSlot}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(booking.status)}
                            </TableCell>
                            <TableCell>
                              {getPaymentStatusBadge(booking.paymentStatus, booking.paymentType)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleViewDetails(booking)}
                                >
                                  <FileText className="h-4 w-4" />
                                  <span className="sr-only">View Details</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Past Bookings</CardTitle>
                <CardDescription>Your booking history</CardDescription>
              </CardHeader>
              <CardContent>
                {filteredPastBookings.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <Clock className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">
                      No past bookings
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {searchQuery
                        ? "No bookings match your search criteria."
                        : "You don't have any past car wash appointments."}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Service</TableHead>
                          <TableHead>Vehicle</TableHead>
                          <TableHead>Date & Time</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Payment</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPastBookings.map((booking) => (
                          <TableRow key={booking.id}>
                            <TableCell className="font-medium">
                              {booking.service.name}
                            </TableCell>
                            <TableCell>{booking.vehicle.model}</TableCell>
                            <TableCell>
                              {format(
                                new Date(booking.date),
                                "MMM d, yyyy"
                              )} at {booking.timeSlot}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(booking.status)}
                            </TableCell>
                            <TableCell>
                              {getPaymentStatusBadge(booking.paymentStatus, booking.paymentType)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleViewDetails(booking)}
                                >
                                  <FileText className="h-4 w-4" />
                                  <span className="sr-only">View Details</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Booking Details Dialog */}
        {selectedBooking && (
          <Dialog
            open={!!selectedBooking}
            onOpenChange={() => setSelectedBooking(null)}
          >
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Booking Details</DialogTitle>
                <DialogDescription>
                  Booking #{selectedBooking.id}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Service</Label>
                  <div className="col-span-3 font-medium">
                    {selectedBooking.service.name}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Vehicle</Label>
                  <div className="col-span-3">
                    {selectedBooking.vehicle.model}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Date & Time</Label>
                  <div className="col-span-3">
                    {format(
                      new Date(selectedBooking.date),
                      "MMMM d, yyyy"
                    )} at {selectedBooking.timeSlot}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Status</Label>
                  <div className="col-span-3">
                    {getStatusBadge(selectedBooking.status)}
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Payment</Label>
                  <div className="col-span-3">
                    {getPaymentStatusBadge(selectedBooking.paymentStatus, selectedBooking.paymentType)}
                    <div className="text-sm text-muted-foreground mt-1">
                      {selectedBooking.paymentMethod}
                      {selectedBooking.paymentType === "HALF" && " (50% Advance)"}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Price</Label>
                  <div className="col-span-3">
                    Rs{Number(selectedBooking.price).toFixed(2)}
                  </div>
                </div>
                {selectedBooking.notes && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Notes</Label>
                    <div className="col-span-3">{selectedBooking.notes}</div>
                  </div>
                )}
              </div>
              <DialogFooter>
                {selectedBooking.status === "PENDING" && (
                  <>
                    <Button variant="outline" className="sm:w-auto w-full">
                      <Pencil className="mr-2 h-4 w-4" />
                      Reschedule
                    </Button>
                    <Button variant="destructive" className="sm:w-auto w-full">
                      <X className="mr-2 h-4 w-4" />
                      Cancel Booking
                    </Button>
                  </>
                )}
                {selectedBooking.status === "COMPLETED" && (
                  <Button className="sm:w-auto w-full">
                    <Car className="mr-2 h-4 w-4" />
                    Book Again
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
}
