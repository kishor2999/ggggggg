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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Check,
  Download,
  Edit,
  Plus,
  Search,
  X,
  Eye,
  CalendarIcon,
  AlertTriangle,
} from "lucide-react";
import { format, parse } from "date-fns";
import { cn } from "@/lib/utils";
import { PrismaClient } from "@prisma/client";
import { getBookings } from "@/app/actions/bookings";
import { getServices } from "@/app/actions/services";
import { updateAppointment } from "@/app/actions/appointments";
import { getEmployees } from "@/app/actions/employees";
import { toast } from "sonner";

// Add this helper function at the top of the file after imports
const formatTimeSlot = (timeSlot: string | undefined) => {
  if (!timeSlot) return "";
  try {
    // If timeSlot is already in HH:mm format, return formatted
    if (timeSlot.match(/^\d{2}:\d{2}$/)) {
      return format(parse(timeSlot, "HH:mm", new Date()), "h:mm a");
    }
    // If timeSlot is already in AM/PM format, return as is
    return timeSlot;
  } catch (error) {
    console.error("Error formatting time:", error);
    return timeSlot || "";
  }
};

// Add this interface after imports
interface Booking {
  id: string;
  service: {
    id: string;
    name: string;
    price: number;
  };
  vehicle: {
    id: string;
    model: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  date: Date;
  timeSlot: string;
  notes?: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  paymentType: string;
  location?: string;
  updatedAt: Date;
  employee?: {
    id: string;
    name: string;
  } | null;
  price: number;
}

export default function AdminBookings() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [bookingToEdit, setBookingToEdit] = useState<Booking | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [filterService, setFilterService] = useState("All Services");
  const [filterStatus, setFilterStatus] = useState("all");
  const [bookings, setBookings] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log("Fetching data...");

        // Fetch bookings data first to better debug issues
        const bookingsData = await getBookings();
        console.log("Raw bookings data:", JSON.stringify(bookingsData, null, 2));

        // Store debug info
        setDebugInfo({
          bookingsCount: bookingsData?.length || 0,
          rawBookings: bookingsData
        });

        // Continue loading other data - handle potential failures gracefully
        let servicesData: any[] = [];
        let employeesData: any[] = [];

        try {
          servicesData = await getServices();
        } catch (err) {
          console.error("Error fetching services:", err);
        }

        try {
          employeesData = await getEmployees();
        } catch (err) {
          console.error("Error fetching employees:", err);
        }

        // Only process further if we have bookings data
        if (bookingsData && Array.isArray(bookingsData)) {
          // Transform the appointments data to match the Booking interface
          const transformedBookings = bookingsData.map((booking) => {
            console.log("Processing booking:", booking);
            return {
              id: booking.id,
              service: {
                id: booking.service?.id || "",
                name: booking.service?.name || "Unknown Service",
                price: booking.service?.price || 0,
              },
              vehicle: {
                id: booking.vehicle?.id || "",
                model: booking.vehicle?.model || "Unknown Vehicle",
              },
              user: {
                id: booking.user?.id || "",
                name: booking.user?.name || "Unknown User",
                email: booking.user?.email || "",
                phone: booking.phoneNumber || booking.user?.phoneNumber || "",
              },
              date: booking.date,
              timeSlot: booking.timeSlot,
              notes: booking.notes,
              status: booking.status,
              paymentStatus: booking.paymentStatus,
              paymentMethod: booking.paymentMethod,
              paymentType: booking.paymentType || "FULL",
              updatedAt: booking.updatedAt,
              employee: booking.employee ? {
                id: booking.employee?.id || "",
                name: booking.employee?.user?.name || "Unknown Employee"
              } : null,
              price: Number(booking.price) || 0,
            };
          });

          console.log("Transformed bookings:", transformedBookings);
          setBookings(transformedBookings);
        } else {
          console.error("No bookings data returned or invalid format");
          setError("Failed to load bookings data in expected format");
        }

        setServices(servicesData || []);
        setEmployees(employeesData || []);
      } catch (error) {
        console.error("Error loading data:", error);
        setError("Failed to load data. See console for details.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter bookings based on search query and filters
  const filteredBookings = bookings.filter((booking) => {
    // Search query filter
    const matchesSearch =
      booking.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.vehicle.model.toLowerCase().includes(searchQuery.toLowerCase());

    // Service filter
    const matchesService =
      filterService === "All Services" ||
      booking.service.name === filterService;

    // Status filter
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" &&
        (booking.status === "PENDING" || booking.status === "IN_PROGRESS")) ||
      (filterStatus === "completed" && booking.status === "COMPLETED") ||
      (filterStatus === "cancelled" && booking.status === "CANCELLED");

    return (
      matchesSearch &&
      matchesService &&
      matchesStatus
    );
  });

  console.log("Filtered bookings:", filteredBookings);

  // Sort bookings by date (most recent first)
  const sortedBookings = [...filteredBookings].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const handleViewDetails = (booking: any) => {
    const bookingData = {
      ...booking,
      price: booking.price ? Number(booking.price) : 0,
    };
    setSelectedBooking(bookingData);
  };

  const handleEditBooking = (booking: any) => {
    // Create a new object with all the necessary data
    const bookingData = {
      ...booking,
      service: {
        id: booking.service?.id || "",
        name: booking.service?.name || "",
        description: booking.service?.description || "",
        price: booking.service?.price || 0,
        duration: booking.service?.duration || 0,
      },
      vehicle: {
        id: booking.vehicle?.id || "",
        type: booking.vehicle?.type || "",
        model: booking.vehicle?.model || "",
        plate: booking.vehicle?.plate || "",
      },
      timeSlot: booking.timeSlot || "",
      notes: booking.notes || "",
      date: booking.date || new Date(),
      price: booking.price ? Number(booking.price) : 0,
      status: booking.status || "PENDING",
      paymentStatus: booking.paymentStatus || "PENDING",
      paymentMethod: booking.paymentMethod || "",
      employee: booking.employee || null,
    };

    console.log("Editing booking:", bookingData); // Add this for debugging
    setBookingToEdit(bookingData);
    setIsEditDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge className="bg-green-500">Completed</Badge>;
      case "PENDING":
        return <Badge>Scheduled</Badge>;
      case "IN_PROGRESS":
        return <Badge className="bg-yellow-500">In Progress</Badge>;
      case "CANCELLED":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: string, paymentType: string) => {
    // Normalize values to handle case sensitivity
    const normalizedStatus = status?.toUpperCase() || '';
    const normalizedPaymentType = paymentType?.toUpperCase() || '';

    if (normalizedStatus === "PAID" || normalizedStatus === "SUCCESS") {
      if (normalizedPaymentType === "HALF") {
        return <Badge className="bg-blue-500">Half Paid</Badge>;
      }
      return <Badge className="bg-green-500">Fully Paid</Badge>;
    }

    switch (normalizedStatus) {
      case "HALF_PAID":
        return <Badge className="bg-blue-500">Half Paid</Badge>;
      case "PENDING":
        return <Badge variant="outline">Pending</Badge>;
      case "REFUNDED":
        return <Badge variant="secondary">Refunded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const clearFilters = () => {
    setFilterService("All Services");
    setFilterStatus("all");
    setSearchQuery("");
  };

  // Add the save handler function
  const handleSaveChanges = async () => {
    try {
      if (!bookingToEdit) return;
      setIsSaving(true);

      console.log("Saving changes with payment type:", bookingToEdit.paymentType);

      const updatedBooking = await updateAppointment(bookingToEdit.id, {
        serviceId: bookingToEdit.service?.id,
        vehicleId: bookingToEdit.vehicle?.id,
        date: new Date(bookingToEdit.date),
        timeSlot: bookingToEdit.timeSlot,
        notes: bookingToEdit.notes,
        status: bookingToEdit.status,
        employeeId: bookingToEdit.employee?.id || null,
        paymentStatus: bookingToEdit.paymentStatus,
        paymentType: bookingToEdit.paymentType,
      });

      // Update the bookings list with the new data
      setBookings((prevBookings) =>
        prevBookings.map((booking) => {
          if (booking.id === updatedBooking.id) {
            return {
              ...booking,
              ...updatedBooking,
              employee: updatedBooking.employee
                ? {
                  id: updatedBooking.employee.id,
                  name: employees.find((e) => e.id === updatedBooking.employee?.id)?.user?.name || "Unknown Employee",
                }
                : null,
            };
          }
          return booking;
        })
      );

      toast.success("Booking updated successfully");
      setIsEditDialogOpen(false);
      setBookingToEdit(null);
    } catch (error) {
      console.error("Error updating booking:", error);
      toast.error("Failed to update booking");
    } finally {
      setIsSaving(false);
    }
  };

  // Update the state setters with proper typing
  const handleServiceChange = (value: string) => {
    const selectedService = services.find((s) => s.id === value);
    setBookingToEdit((prev: Booking | null) =>
      prev
        ? {
          ...prev,
          service: selectedService,
        }
        : null
    );
  };

  // Update other setters similarly
  const handleVehicleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBookingToEdit((prev: Booking | null) =>
      prev
        ? {
          ...prev,
          vehicle: { ...prev.vehicle, model: e.target.value },
        }
        : null
    );
  };

  const handleDateChange = (date: Date | undefined) => {
    if (!date) return;
    setBookingToEdit((prev: Booking | null) =>
      prev ? { ...prev, date } : null
    );
  };

  const handleTimeChange = (value: string) => {
    setBookingToEdit((prev: Booking | null) =>
      prev ? { ...prev, timeSlot: value } : null
    );
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBookingToEdit((prev: Booking | null) =>
      prev ? { ...prev, notes: e.target.value } : null
    );
  };

  // Update the staff selection handler
  const handleEmployeeChange = (value: string) => {
    if (value === "unassigned") {
      // If unassigned value, set employee to null
      setBookingToEdit((prev) => prev ? { ...prev, employee: null } : null);
      return;
    }

    const selectedEmployee = employees.find((e) => e.id === value);
    if (!selectedEmployee) return;

    setBookingToEdit((prev) =>
      prev
        ? {
          ...prev,
          employee: {
            id: selectedEmployee.id,
            name: selectedEmployee.user?.name || "Unknown Employee",
          },
        }
        : null
    );
  };

  if (loading) {
    return (
      <DashboardLayout userRole="admin">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="admin">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Bookings Management</h1>
            <p className="text-muted-foreground">
              View and manage all car wash bookings
            </p>
          </div>
          <div className="flex gap-2">
            <div className="relative max-w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search bookings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 max-w-[300px]"
              />
            </div>
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger
                value="all"
                onClick={() => setFilterStatus("all")}
              >
                All
              </TabsTrigger>
              <TabsTrigger
                value="active"
                onClick={() => setFilterStatus("active")}
              >
                Active
              </TabsTrigger>
              <TabsTrigger
                value="completed"
                onClick={() => setFilterStatus("completed")}
              >
                Completed
              </TabsTrigger>
              <TabsTrigger
                value="cancelled"
                onClick={() => setFilterStatus("cancelled")}
              >
                Cancelled
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="mb-6">
          <Label htmlFor="serviceFilter">Filter by Service</Label>
          <Select
            value={filterService}
            onValueChange={setFilterService}
          >
            <SelectTrigger id="serviceFilter">
              <SelectValue placeholder="All Services" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Services">All Services</SelectItem>
              {services.map((service) => (
                <SelectItem key={service.id} value={service.name}>
                  {service.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            <span className="ml-3">Loading bookings...</span>
          </div>
        ) : error ? (
          <Card className="bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                <p className="font-semibold">Error loading bookings</p>
              </div>
              <p className="mt-2">{error}</p>
            </CardContent>
          </Card>
        ) : sortedBookings.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <h3 className="text-lg font-medium mb-2">No bookings found</h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery || filterService !== "All Services" || filterStatus !== "all"
                    ? "Try clearing your filters or search query"
                    : "No bookings have been made yet."}
                </p>

                {/* Debug information card - helpful for troubleshooting */}
                {/* {debugInfo && (
                  <div className="mt-6 text-left border p-4 rounded-md">
                    <h4 className="font-semibold mb-2">Debug Information</h4>
                    <p>Raw bookings count: {debugInfo.bookingsCount}</p>
                    <p>Filtered bookings count: {sortedBookings.length}</p>
                    <p>Search query: {searchQuery || "None"}</p>
                    <p>Service filter: {filterService}</p>
                    <p>Status filter: {filterStatus}</p>

                    <details className="mt-4">
                      <summary className="cursor-pointer text-primary">Show/Hide Raw Booking Data</summary>
                      <pre className="mt-2 bg-gray-100 p-2 rounded text-xs overflow-auto max-h-[300px]">
                        {JSON.stringify(debugInfo.rawBookings, null, 2)}
                      </pre>
                    </details>
                  </div>
                )} */}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle>All Bookings</CardTitle>
                <CardDescription>Manage all car wash bookings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Employee</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedBookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell>
                            <div className="font-medium">
                              {booking.user.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {booking.user.email}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>{booking.service.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {booking.vehicle.model}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              {format(new Date(booking.date), "MMM d, yyyy")}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(booking.date), "h:mm a")}
                            </div>
                          </TableCell>
                          <TableCell>
                            {booking.employee?.name || "Unassigned"}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(booking.status)}
                          </TableCell>
                          <TableCell>
                            {getPaymentStatusBadge(booking.paymentStatus, booking.paymentType)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <div
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                onClick={() => handleViewDetails(booking)}
                              >
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">View Details</span>
                              </div>
                              <div
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                onClick={() => handleEditBooking(booking)}
                              >
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </div>
                              {booking.status === "COMPLETED" && (
                                <div className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer">
                                  <Download className="h-4 w-4" />
                                  <span className="sr-only">Download</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Booking Details Dialog */}
            {selectedBooking && !isEditDialogOpen && (
              <Dialog
                open={!!selectedBooking && !isEditDialogOpen}
                onOpenChange={() => setSelectedBooking(null)}
              >
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Booking Details</DialogTitle>
                    <DialogDescription>
                      Booking #{selectedBooking.id}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-semibold mb-2">Customer Information</h3>
                        <div className="space-y-1">
                          <div className="text-sm">
                            <span className="font-medium">Name:</span>{" "}
                            {selectedBooking.user.name}
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Email:</span>{" "}
                            {selectedBooking.user.email}
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Phone:</span>{" "}
                            {selectedBooking.user.phone}
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-2">Booking Information</h3>
                        <div className="space-y-1">
                          <div className="text-sm">
                            <span className="font-medium">Service:</span>{" "}
                            {selectedBooking.service.name}
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Vehicle:</span>{" "}
                            {selectedBooking.vehicle.model}
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Date:</span>{" "}
                            {format(new Date(selectedBooking.date), "MMMM d, yyyy")}
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Time:</span>{" "}
                            {format(new Date(selectedBooking.date), "h:mm a")}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="font-semibold mb-2">Assignment</h3>
                        <div className="space-y-1">
                          <div className="text-sm">
                            <span className="font-medium">Employee:</span>{" "}
                            {selectedBooking.employee?.name || "Unassigned"}
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Location:</span>{" "}
                            {selectedBooking.location}
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-2">Payment</h3>
                        <div className="space-y-1">
                          <div className="text-sm">
                            <span className="font-medium">Amount:</span> Rs.
                            {typeof selectedBooking?.price === "number"
                              ? selectedBooking.price.toFixed(2)
                              : "0.00"}
                            {selectedBooking.paymentType === "HALF" && " (50% Advance)"}
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Status:</span>{" "}
                            {getPaymentStatusBadge(selectedBooking.paymentStatus, selectedBooking.paymentType)}
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Method:</span>{" "}
                            {selectedBooking?.paymentMethod}
                          </div>
                        </div>
                      </div>
                    </div>

                    {selectedBooking.notes && (
                      <div>
                        <h3 className="font-semibold mb-2">Notes</h3>
                        <div className="text-sm border rounded-md p-3 bg-muted/50">
                          {selectedBooking.notes}
                        </div>
                      </div>
                    )}

                    <div>
                      <h3 className="font-semibold mb-2">Status</h3>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(selectedBooking.status)}
                        <span className="text-sm text-muted-foreground">
                          Last updated:{" "}
                          {format(
                            new Date(selectedBooking.updatedAt),
                            "MMM d, yyyy h:mm a"
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                  <DialogFooter className="flex flex-col sm:flex-row gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleEditBooking(selectedBooking)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Booking
                    </Button>
                    {selectedBooking.status === "PENDING" && (
                      <Button>
                        <Check className="mr-2 h-4 w-4" />
                        Mark as In Progress
                      </Button>
                    )}
                    {selectedBooking.status === "IN_PROGRESS" && (
                      <Button>
                        <Check className="mr-2 h-4 w-4" />
                        Mark as Completed
                      </Button>
                    )}
                    {(selectedBooking.status === "PENDING" ||
                      selectedBooking.status === "IN_PROGRESS") && (
                        <Button variant="destructive">
                          <X className="mr-2 h-4 w-4" />
                          Cancel Booking
                        </Button>
                      )}
                    {selectedBooking.status === "COMPLETED" && (
                      <Button>
                        <Download className="mr-2 h-4 w-4" />
                        Download Invoice
                      </Button>
                    )}
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            {/* Edit Booking Dialog */}
            {bookingToEdit && isEditDialogOpen && (
              <Dialog
                open={isEditDialogOpen}
                onOpenChange={(open) => {
                  setIsEditDialogOpen(open);
                  if (!open) {
                    setBookingToEdit(null);
                  }
                }}
              >
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Edit Booking</DialogTitle>
                    <DialogDescription>
                      Update booking #{bookingToEdit.id} details
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <Tabs defaultValue="details" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="details">Details</TabsTrigger>
                        <TabsTrigger value="assignment">Assignment</TabsTrigger>
                        <TabsTrigger value="status">Status</TabsTrigger>
                      </TabsList>

                      <TabsContent value="details" className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="edit-service">Service</Label>
                            <Select
                              value={bookingToEdit?.service?.id || ""}
                              onValueChange={handleServiceChange}
                            >
                              <SelectTrigger id="edit-service" className="w-full">
                                <SelectValue placeholder="Select service">
                                  {bookingToEdit?.service?.name}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {services.map((service) => (
                                  <SelectItem key={service.id} value={service.id}>
                                    {service.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor="edit-vehicle">Vehicle</Label>
                            <Input
                              id="edit-vehicle"
                              value={bookingToEdit?.vehicle?.model || ""}
                              onChange={handleVehicleChange}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="edit-date">Date</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  id="edit-date"
                                  variant="outline"
                                  className="w-full justify-start text-left font-normal"
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {bookingToEdit?.date
                                    ? format(new Date(bookingToEdit.date), "PPP")
                                    : "Pick a date"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={
                                    bookingToEdit?.date
                                      ? new Date(bookingToEdit.date)
                                      : undefined
                                  }
                                  onSelect={handleDateChange}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor="edit-time">Time</Label>
                            <Select
                              value={bookingToEdit?.timeSlot || ""}
                              onValueChange={handleTimeChange}
                            >
                              <SelectTrigger id="edit-time" className="w-full">
                                <SelectValue placeholder="Select time">
                                  {formatTimeSlot(bookingToEdit?.timeSlot)}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {[
                                  "09:00",
                                  "09:30",
                                  "10:00",
                                  "10:30",
                                  "11:00",
                                  "11:30",
                                  "12:00",
                                  "12:30",
                                  "13:00",
                                  "13:30",
                                  "14:00",
                                  "14:30",
                                  "15:00",
                                  "15:30",
                                  "16:00",
                                  "16:30",
                                  "17:00",
                                ].map((time) => (
                                  <SelectItem key={time} value={time}>
                                    {format(
                                      parse(time, "HH:mm", new Date()),
                                      "h:mm a"
                                    )}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="edit-notes">Notes</Label>
                          <Input
                            id="edit-notes"
                            value={bookingToEdit?.notes || ""}
                            onChange={handleNotesChange}
                          />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label className="text-right">Price</Label>
                          <div className="col-span-3">
                            $
                            {typeof bookingToEdit?.price === "number"
                              ? bookingToEdit.price.toFixed(2)
                              : "0.00"}
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="assignment" className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="grid gap-2">
                            <Label htmlFor="edit-employee">Assigned Employee</Label>
                            <Select
                              value={bookingToEdit.employee?.id || "unassigned"}
                              onValueChange={handleEmployeeChange}
                            >
                              <SelectTrigger id="edit-employee" className="w-full">
                                <SelectValue placeholder="Select employee" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unassigned">None (Unassigned)</SelectItem>
                                {employees.map((employee) => (
                                  <SelectItem key={employee.id} value={employee.id}>
                                    {employee.user?.name || `Employee ${employee.id.substring(0, 5)}`}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="status" className="space-y-4 mt-4">
                        <div className="grid gap-2">
                          <Label htmlFor="edit-status">Booking Status</Label>
                          <Select
                            defaultValue={bookingToEdit.status}
                            onValueChange={(status) => {
                              setBookingToEdit(prev =>
                                prev ? { ...prev, status } : null
                              );
                            }}
                          >
                            <SelectTrigger id="edit-status" className="w-full">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PENDING">Scheduled</SelectItem>
                              <SelectItem value="IN_PROGRESS">
                                In Progress
                              </SelectItem>
                              <SelectItem value="COMPLETED">Completed</SelectItem>
                              <SelectItem value="CANCELLED">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="edit-payment-status">
                            Payment Status
                          </Label>
                          <Select
                            defaultValue={bookingToEdit.paymentStatus}
                            onValueChange={(paymentStatus) => {
                              setBookingToEdit(prev =>
                                prev ? { ...prev, paymentStatus } : null
                              );
                            }}
                          >
                            <SelectTrigger
                              id="edit-payment-status"
                              className="w-full"
                            >
                              <SelectValue placeholder="Select payment status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PENDING">Pending</SelectItem>
                              <SelectItem value="PAID">Paid</SelectItem>
                              <SelectItem value="HALF_PAID">Half Paid</SelectItem>
                              <SelectItem value="REFUNDED">Refunded</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="edit-payment-type">
                            Payment Type
                          </Label>
                          <Select
                            defaultValue={bookingToEdit.paymentType}
                            onValueChange={(paymentType) => {
                              setBookingToEdit(prev =>
                                prev ? { ...prev, paymentType } : null
                              );
                            }}
                          >
                            <SelectTrigger
                              id="edit-payment-type"
                              className="w-full"
                            >
                              <SelectValue placeholder="Select payment type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="FULL">Full Payment</SelectItem>
                              <SelectItem value="HALF">Half Payment (Advance)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsEditDialogOpen(false)}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleSaveChanges} disabled={isSaving}>
                      {isSaving ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Saving...
                        </div>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
