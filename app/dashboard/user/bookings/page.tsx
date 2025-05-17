"use client";

import { updateAppointment } from "@/app/actions/appointments";
import fetchUserAppointments from "@/app/actions/fetch-user-appointments";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getUrlParam } from "@/lib/navigation-utils";
import { format } from "date-fns";
import {
  Calendar,
  Car,
  Clock,
  FileText,
  Pencil,
  Search,
  X
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";



export default function BookingHistory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Ensure we're in the client before doing anything
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Only run this effect on the client
    if (!isMounted) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        const appointments = await fetchUserAppointments();
        console.log("Bookings loaded:", appointments.map((app: any) => ({
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

    fetchData();

    // Handle payment_success URL parameter - safely
    if (typeof window !== 'undefined') {
      try {
        const paymentSuccess = getUrlParam('payment_success') === 'true';
        
        if (paymentSuccess) {
          console.log("Payment success detected in URL");
          
          // Show success toast
          toast.success("Payment completed successfully!", {
            description: "Your booking has been confirmed.",
            duration: 5000,
          });

          // Clear the URL parameter after showing the notification
          const newUrl = window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        }
      } catch (error) {
        console.error("Error handling URL parameters:", error);
      }
    }
  }, [isMounted]);

  const upcomingBookings = bookings
    .filter((booking) => {
      const bookingDate = new Date(booking.date);
      const now = new Date();
      // Include both PENDING and SCHEDULED bookings in the future
      return (booking.status === "PENDING" || booking.status === "SCHEDULED") && bookingDate > now;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const pastBookings = bookings
    .filter((booking) => {
      const bookingDate = new Date(booking.date);
      const now = new Date();
      // Show COMPLETED bookings or past PENDING/SCHEDULED bookings
      return (
        booking.status === "COMPLETED" ||
        ((booking.status === "PENDING" || booking.status === "SCHEDULED") && bookingDate <= now)
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

  const handleCancelBooking = async (bookingId: string) => {
    try {
      setCancelLoading(true);
      
      await updateAppointment(bookingId, {
        status: "CANCELLED"
      });
      
      toast.success("Booking cancelled successfully");
      
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: "CANCELLED" } 
            : booking
        )
      );
      
      setSelectedBooking(null);
    } catch (error) {
      console.error("Error cancelling booking:", error);
      toast.error("Failed to cancel booking. Please try again.");
    } finally {
      setCancelLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge className="bg-green-500">Completed</Badge>;
      case "PENDING":
        return <Badge>Pending</Badge>;
      case "SCHEDULED":
        return <Badge className="bg-blue-500">Scheduled</Badge>;
      case "CANCELLED":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string, paymentType: string) => {
    // Add debugging
    console.log("Payment status badge:", { status, paymentType });

    // Handle null or undefined values
    if (!status) return <Badge variant="outline">Unknown</Badge>;

    // Normalize the values to handle case sensitivity issues
    const normalizedStatus = status?.toUpperCase() || '';
    const normalizedPaymentType = paymentType?.toUpperCase() || '';

    if (normalizedStatus === "PAID" || normalizedStatus === "SUCCESS") {
      if (normalizedPaymentType === "HALF") {
        return <Badge className="bg-yellow-500">Half Paid</Badge>;
      }
      return <Badge className="bg-green-500">Fully Paid</Badge>;
    }

    if (normalizedStatus === "PENDING") {
        return <Badge variant="outline">Pending</Badge>;
    }
    
    if (normalizedStatus === "FAILED") {
        return <Badge variant="destructive">Failed</Badge>;
    }
    
    // Default case
        return <Badge variant="outline">{status}</Badge>;
  };

  // Create content based on state
  let content;
  
  if (loading) {
    content = (
        <div className="flex items-center justify-center h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading bookings...</p>
          </div>
        </div>
    );
  } else if (!bookings.length && !loading) {
    content = (
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
        
        <div className="text-center py-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Calendar className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">
            No bookings found
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            You don't have any car wash appointments yet.
          </p>
          <Button className="mt-4" asChild>
            <a href="/dashboard/user/book">Book a Service</a>
          </Button>
        </div>
      </div>
    );
  } else {
    content = (
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
            <DialogContent className="sm:max-w-[500px] max-h-[85vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Booking Details</DialogTitle>
                <DialogDescription>
                  Booking #{selectedBooking.id}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 overflow-y-auto pr-1">
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
                    Rs{selectedBooking.price}
                  </div>
                </div>
                {selectedBooking.notes && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Notes</Label>
                    <div className="col-span-3">{selectedBooking.notes}</div>
                  </div>
                )}
                
                <div className="mt-4 border-t pt-4">
                  <div className="bg-blue-50 p-3 rounded-md">
                    <p className="text-sm font-medium text-blue-800">Contact Information:</p>
                    <p className="text-sm text-blue-700 mt-1">
                      To reschedule or cancel your booking, please contact our customer service at: <span className="font-bold">9876543210</span>
                    </p>
                  </div>
                </div>
              </div>
              <DialogFooter className="flex-col items-stretch gap-2 sm:flex-row sm:items-center border-t pt-4 mt-auto">
                {(selectedBooking.status === "PENDING" || selectedBooking.status === "SCHEDULED") && (
                  <>
                    <Button 
                      variant="destructive" 
                      className="sm:w-auto w-full"
                      onClick={() => handleCancelBooking(selectedBooking.id)}
                      disabled={cancelLoading}
                    >
                      {cancelLoading ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Cancelling...
                        </>
                      ) : (
                        <>
                      <X className="mr-2 h-4 w-4" />
                      Cancel Booking
                        </>
                      )}
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
    );
  }

  // Always return the same component structure
  return <DashboardLayout userRole="user">{isMounted ? content : null}</DashboardLayout>;
}
