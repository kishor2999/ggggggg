"use client";

import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import {  Card,  CardContent,  CardDescription,  CardHeader,  CardTitle,} from "@/components/ui/card";
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
import { getTimeSlotAvailability } from "@/app/actions/bookings";
import { EVENT_TYPES, getDateAvailabilityChannel, pusherClient } from "@/lib/pusher";

// Improve the formatTimeSlot function to be more robust
const formatTimeSlot = (timeSlot: string | undefined) => {
  if (!timeSlot) return "";
  try {
    // If timeSlot is already in HH:mm format (24-hour), convert to 12-hour
    if (timeSlot.match(/^\d{1,2}:\d{2}$/)) {
      const [hourStr, minuteStr] = timeSlot.split(':');
      let hour = parseInt(hourStr);
      const minute = parseInt(minuteStr);
      const period = hour >= 12 ? 'PM' : 'AM';
      hour = hour % 12 || 12; // Convert 0 to 12 for 12 AM
      return `${hour}:${minute.toString().padStart(2, '0')} ${period}`;
    }
    
    // If timeSlot is already in h:mm a format (12-hour), make sure it's formatted consistently
    const matches = timeSlot.match(/(\d+):(\d+)\s?(AM|PM|am|pm)/i);
    if (matches) {
      const [_, hourStr, minuteStr, periodStr] = matches;
      const hour = parseInt(hourStr);
      const minute = parseInt(minuteStr);
      const period = periodStr.toUpperCase();
      return `${hour}:${minute.toString().padStart(2, '0')} ${period}`;
    }
    
    // If we couldn't parse it, return as is
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
  const [timeSlotAvailability, setTimeSlotAvailability] = useState<Record<string, number>>({});
  const currentChannelRef = useRef<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        ("Fetching data...");

        // Fetch bookings data first to better debug issues
        const bookingsData = await getBookings();
       

        // Add diagnostic for payment statuses
     

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
            // Log each booking's payment details
         

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
              // Use the raw payment status from DB
              paymentStatus: booking.paymentStatus || "PAID",
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

  // Add a new useEffect for Pusher cleanup
  useEffect(() => {
    return () => {
      if (currentChannelRef.current) {
        pusherClient.unsubscribe(currentChannelRef.current);
        currentChannelRef.current = null;
      }
    };
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
        (booking.status === "PENDING" || booking.status === "SCHEDULED" || booking.status === "IN_PROGRESS")) ||
      (filterStatus === "completed" && booking.status === "COMPLETED") ||
      (filterStatus === "cancelled" && booking.status === "CANCELLED");

    return (
      matchesSearch &&
      matchesService &&
      matchesStatus
    );
  });

 

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

  // Update the loadTimeSlotAvailability function
  const loadTimeSlotAvailability = async (selectedDate: Date) => {
    try {
      if (!selectedDate) return;
      
      const availability = await getTimeSlotAvailability(selectedDate);
    
      
      // Create a normalized version of the availability data that handles both formats
      const normalizedAvailability: Record<string, number> = {};
      
      // Process each time slot in the availability data
      Object.entries(availability).forEach(([dbTimeSlot, count]) => {
        // Store original format
        normalizedAvailability[dbTimeSlot] = count;
        
        // Also store 12-hour format version
        try {
          // If it's in 24-hour format, also store 12-hour version
          if (dbTimeSlot.match(/^\d{1,2}:\d{2}$/)) {
            const formatted = formatTimeSlot(dbTimeSlot);
            normalizedAvailability[formatted] = count;
          }
          
          // If it's in 12-hour format, also store 24-hour version
          const matches = dbTimeSlot.match(/(\d+):(\d+)\s(AM|PM)/i);
          if (matches) {
            const [_, hourStr, minuteStr, period] = matches;
            let hour = parseInt(hourStr);
            if (period.toUpperCase() === "PM" && hour < 12) hour += 12;
            if (period.toUpperCase() === "AM" && hour === 12) hour = 0;
            const dbFormat = `${hour.toString().padStart(2, '0')}:${minuteStr}`;
            normalizedAvailability[dbFormat] = count;
          }
        } catch (e) {
          console.error("Error normalizing time format:", e);
        }
      });
      
   
      setTimeSlotAvailability(normalizedAvailability);
      
      // Subscribe to real-time updates for this date
      const dateChannel = getDateAvailabilityChannel(selectedDate);
      
      // Unsubscribe from previous channel if exists
      if (currentChannelRef.current && currentChannelRef.current !== dateChannel) {
        pusherClient.unsubscribe(currentChannelRef.current);
      }
      
      // Subscribe to new channel
      const channel = pusherClient.subscribe(dateChannel);
      currentChannelRef.current = dateChannel;
      
      // Handle availability updates
      channel.bind(EVENT_TYPES.TIMESLOT_AVAILABILITY_UPDATED, (data: any) => {
        
        // Normalize the incoming data
        const normalizedUpdate: Record<string, number> = {};
        
        // Process each time slot in the update data
        Object.entries(data.timeSlotsCount).forEach(([dbTimeSlot, count]) => {
          // Store original format
          normalizedUpdate[dbTimeSlot] = count as number;
          
          // Also store 12-hour format version
          try {
            // If it's in 24-hour format, also store 12-hour version
            if (dbTimeSlot.match(/^\d{1,2}:\d{2}$/)) {
              const formatted = formatTimeSlot(dbTimeSlot);
              normalizedUpdate[formatted] = count as number;
            }
            
            // If it's in 12-hour format, also store 24-hour version
            const matches = dbTimeSlot.match(/(\d+):(\d+)\s(AM|PM)/i);
            if (matches) {
              const [_, hourStr, minuteStr, period] = matches;
              let hour = parseInt(hourStr);
              if (period.toUpperCase() === "PM" && hour < 12) hour += 12;
              if (period.toUpperCase() === "AM" && hour === 12) hour = 0;
              const dbFormat = `${hour.toString().padStart(2, '0')}:${minuteStr}`;
              normalizedUpdate[dbFormat] = count as number;
            }
          } catch (e) {
            console.error("Error normalizing time format in update:", e);
          }
        });
        
        
        setTimeSlotAvailability(normalizedUpdate);
      });
      
      (`Subscribed to availability updates for date: ${dateChannel}`);
    } catch (error) {
      console.error("Error loading time slot availability:", error);
    }
  };

  // Update the handleEditBooking function to load availability
  const handleEditBooking = (booking: any) => {
    const bookingData = {
      id: booking.id,
      service: booking.service,
      vehicle: booking.vehicle,
      user: booking.user,
      date: new Date(booking.date),
      timeSlot: booking.timeSlot,
      notes: booking.notes,
      price: booking.price ? Number(booking.price) : 0,
      status: booking.status || "PENDING",
      paymentStatus: booking.paymentStatus || "PAID",
      paymentMethod: booking.paymentMethod || "",
      paymentType: booking.paymentType || "FULL",
      updatedAt: booking.updatedAt || new Date(),
      employee: booking.employee || null,
    };

    // Add detailed debugging for payment status
  

    setBookingToEdit(bookingData);
    setIsEditDialogOpen(true);
    
    // Load time slot availability for the booking date
    if (bookingData.date) {
      loadTimeSlotAvailability(bookingData.date);
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    // Handle standard statuses directly
    if (status === "PAID" || status === "SUCCESS") {
      return <Badge className="bg-green-500">PAID</Badge>;
    }

    if (status === "REFUNDED") {
      return <Badge variant="secondary">REFUNDED</Badge>;
    }

    // Fallback for any unexpected values
    return <Badge variant="outline">{status || "Unknown"}</Badge>;
  };

  const getPaymentTypeBadge = (type: string) => {
    if (type === "HALF") {
      return <Badge className="bg-blue-500">HALF</Badge>;
    }

    if (type === "FULL") {
      return <Badge className="bg-slate-500">FULL</Badge>;
    }

    // Fallback for any unexpected values
    return <Badge variant="outline">{type || "FULL"}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge className="bg-green-500">Completed</Badge>;
      case "PENDING":
        return <Badge variant="outline">Pending</Badge>;
      case "SCHEDULED":
        return <Badge className="bg-blue-500">Scheduled</Badge>;
      case "IN_PROGRESS":
        return <Badge className="bg-yellow-500">In Progress</Badge>;
      case "CANCELLED":
        return <Badge variant="destructive">Cancelled</Badge>;
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

     

      // Get the original booking to compare changes
      const originalBooking = bookings.find(b => b.id === bookingToEdit.id);
      
      // Check if this is a reschedule
      const isRescheduled = 
        originalBooking && 
        (new Date(originalBooking.date).toDateString() !== new Date(bookingToEdit.date).toDateString() || 
        originalBooking.timeSlot !== bookingToEdit.timeSlot);

      // Fix any timezone issues with the date
      // Create a new date with time set to noon to avoid timezone shifts
      const dateToSave = new Date(bookingToEdit.date);
      
      // Apply both techniques to ensure consistency
      dateToSave.setHours(12, 0, 0, 0);
      
      // Apply timezone offset compensation if needed
      const userTimezoneOffset = dateToSave.getTimezoneOffset() * 60000;
      const finalDateToSave = new Date(dateToSave.getTime() - userTimezoneOffset);
      
     

      // Prepare the data for update
      const updateData: any = {
        vehicleId: bookingToEdit.vehicle?.id,
        date: finalDateToSave, // Use the fully timezone-adjusted date
        timeSlot: bookingToEdit.timeSlot,
        notes: bookingToEdit.notes,
        status: bookingToEdit.status,
        employeeId: bookingToEdit.employee?.id || null,
        paymentStatus: bookingToEdit.paymentStatus,
      };

      // Make the update call
      const updatedBooking = await updateAppointment(bookingToEdit.id, updateData);

     

      // Refresh the bookings data to ensure we have the latest data
      const refreshedBookings = await getBookings();
      if (refreshedBookings && Array.isArray(refreshedBookings)) {
        const transformedBookings = refreshedBookings.map((booking) => {
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
            // Use the raw payment status from DB
            paymentStatus: booking.paymentStatus || "PAID",
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

        setBookings(transformedBookings);
      } else {
        // Fallback to updating just the specific booking
        setBookings((prevBookings) =>
          prevBookings.map((booking) => {
            if (booking.id === updatedBooking.id) {
              return {
                ...booking,
                ...updatedBooking,
                paymentStatus: updatedBooking.paymentStatus || "PAID",
                paymentType: updatedBooking.paymentType || "FULL",
                timeSlot: updatedBooking.timeSlot,
                date: updatedBooking.date,
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
      }

      // Show appropriate toast message
      if (isRescheduled) {
        toast.success("Appointment successfully rescheduled");
      } else {
      toast.success("Booking updated successfully");
      }
      
      setIsEditDialogOpen(false);
      setBookingToEdit(null);
    } catch (error) {
      console.error("Error updating booking:", error);
      // Get the error message from the error object if available
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to update booking';
        
      // Show more specific error message
      if (errorMessage.includes('fully booked')) {
        toast.error("This time slot is already fully booked. Please select a different time.");
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Update the state setters with proper typing
  const handleServiceChange = (value: string) => {
    // Service editing is disabled, so this is just for reference
    ("Service editing is disabled");
    return; // Do nothing since service editing is disabled
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

  // Update handleDateChange to load availability for the new date
  const handleDateChange = (date: Date | undefined) => {
    if (!date) return;
    
    // Create a new date object to avoid modifying the input date
    const newDate = new Date(date);
    
    // Set time to noon to avoid timezone issues
    newDate.setHours(12, 0, 0, 0);
   
    // Load time slot availability for the new date
    loadTimeSlotAvailability(newDate);
    
    setBookingToEdit((prev: Booking | null) =>
      prev ? { ...prev, date: newDate } : null
    );
  };

  const handleTimeChange = (value: string) => {
    // Allow time editing
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

  // Create content based on loading/error state
  let content;

  if (loading) {
    content = (
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
    );
  } else {
    content = (
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

        {error ? (
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
                        <TableHead>Payment Status</TableHead>
                        <TableHead>Payment Type</TableHead>
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
                              {(() => {
                                try {
                                  // Create a date object and apply timezone offset compensation
                                  const date = new Date(booking.date);
                                  const userTimezoneOffset = date.getTimezoneOffset() * 60000;
                                  const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
                                  
                                  // Set hours to noon as additional precaution
                                  adjustedDate.setHours(12, 0, 0, 0);
                                  
                                  return format(adjustedDate, "MMM d, yyyy");
                                } catch (e) {
                                  console.error("Error formatting date:", e);
                                  return "Invalid date";
                                }
                              })()}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {booking.timeSlot ? formatTimeSlot(booking.timeSlot) : ""}
                            </div>
                          </TableCell>
                          <TableCell>
                            {booking.employee?.name || "Unassigned"}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(booking.status)}
                          </TableCell>
                          <TableCell>
                            {getPaymentStatusBadge(booking.paymentStatus)}
                          </TableCell>
                          <TableCell>
                            {getPaymentTypeBadge(booking.paymentType)}
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
                <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
                  <DialogHeader>
                    <DialogTitle>Booking Details</DialogTitle>
                    <DialogDescription>
                      Booking #{selectedBooking.id}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="overflow-y-auto pr-2 flex-1">
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
                              {(() => {
                                try {
                                  // Create a date object and apply timezone offset compensation
                                  const date = new Date(selectedBooking.date);
                                  const userTimezoneOffset = date.getTimezoneOffset() * 60000;
                                  const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
                                  
                                  // Set hours to noon as additional precaution
                                  adjustedDate.setHours(12, 0, 0, 0);
                                  
                                  return format(adjustedDate, "MMMM d, yyyy");
                                } catch (e) {
                                  console.error("Error formatting date:", e);
                                  return "Invalid date";
                                }
                              })()}
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Time:</span>{" "}
                              {selectedBooking.timeSlot ? formatTimeSlot(selectedBooking.timeSlot) : ""}
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
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Payment Status:</span>{" "}
                            {getPaymentStatusBadge(selectedBooking.paymentStatus)}
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Payment Type:</span>{" "}
                            {getPaymentTypeBadge(selectedBooking.paymentType)}
                            {selectedBooking.paymentType === "HALF" && " (50% Advance)"}
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
                    <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4 pt-4 border-t">
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
                  </div>
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
                <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
                  <DialogHeader>
                    <DialogTitle>Edit Booking</DialogTitle>
                    <DialogDescription>
                      Update booking #{bookingToEdit?.id} details
                    </DialogDescription>
                  </DialogHeader>
                  <div className="overflow-y-auto pr-2 flex-1">
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
                              disabled={true}
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
                            <Input
                                  id="edit-date"
                              type="date"
                              value={(() => {
                                if (!bookingToEdit?.date) return "";
                                
                                // Create a new date object from the booking date
                                const date = new Date(bookingToEdit.date);
                                
                                // Format the date as YYYY-MM-DD without timezone adjustments
                                return date.toISOString().split('T')[0];
                              })()}
                              onChange={(e) => {
                                if (e.target.value) {
                                  // Create a new date from the selected value
                                  const selectedDate = new Date(e.target.value);
                                  
                                  // Set the time to noon to avoid any timezone issues
                                  selectedDate.setHours(12, 0, 0, 0);
                                  
                                  handleDateChange(selectedDate);
                                }
                              }}
                              min={new Date().toISOString().split('T')[0]}
                              className="w-full"
                            />
                          
                          </div>

                          <div className="grid gap-2">
                            <Label htmlFor="edit-time">Time</Label>
                            <Select
                              value={bookingToEdit?.timeSlot || ""}
                              onValueChange={handleTimeChange}
                              disabled={false}
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
                                ].map((time) => {
                                  // Check if this time slot is at capacity (excluding current booking)
                                  const bookingsCount = timeSlotAvailability[time] || timeSlotAvailability[formatTimeSlot(time)] || 0;
                                  
                                  // If this is the current booking's time slot, we don't count it
                                  const adjustedCount = 
                                    bookingToEdit?.timeSlot === time 
                                      ? Math.max(0, bookingsCount - 1) 
                                      : bookingsCount;
                                      
                                  const isAtCapacity = adjustedCount >= 2;
                                  
                                  return (
                                    <SelectItem 
                                      key={time} 
                                      value={time}
                                      disabled={isAtCapacity}
                                    >
                                      <div className="flex justify-between items-center w-full">
                                        <span>
                                    {format(
                                      parse(time, "HH:mm", new Date()),
                                      "h:mm a"
                                    )}
                                        </span>
                                        {isAtCapacity && (
                                          <span className="text-xs text-red-500 ml-2">
                                            Fully booked
                                          </span>
                                        )}
                                        {!isAtCapacity && (
                                          <span className="text-xs text-green-600 ml-2">
                                            {2 - adjustedCount} {adjustedCount === 1 ? "spot" : "spots"} left
                                          </span>
                                        )}
                                      </div>
                                  </SelectItem>
                                  );
                                })}
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
                            Rs.
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
                          <Label htmlFor="edit-booking-status">
                            Booking Status
                          </Label>
                          <Select
                            value={bookingToEdit.status}
                            onValueChange={(status) => {
                              setBookingToEdit(prev => {
                                if (!prev) return null;
                                return {
                                  ...prev,
                                  status
                                };
                              });
                            }}
                          >
                            <SelectTrigger
                              id="edit-booking-status"
                              className="w-full"
                            >
                              <SelectValue placeholder="Select booking status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PENDING">PENDING</SelectItem>
                              <SelectItem value="SCHEDULED">SCHEDULED</SelectItem>
                              <SelectItem value="IN_PROGRESS">IN PROGRESS</SelectItem>
                              <SelectItem value="COMPLETED">COMPLETED</SelectItem>
                              <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="edit-payment-status">
                            Payment Status
                          </Label>
                          <Select
                            value={bookingToEdit.paymentStatus}
                            onValueChange={(paymentStatus) => {
                             

                              // Update the payment status in the edit state
                              setBookingToEdit(prev => {
                                if (!prev) return null;

                              

                                return {
                                  ...prev,
                                  paymentStatus
                                };
                              });
                            }}
                          >
                            <SelectTrigger
                              id="edit-payment-status"
                              className="w-full"
                            >
                              <SelectValue placeholder="Select payment status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PAID">PAID</SelectItem>
                              <SelectItem value="REFUNDED">REFUNDED</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                  <DialogFooter className="mt-4 pt-4 border-t">
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
  );
  }

  // Use only one DashboardLayout wrapper
  return <DashboardLayout userRole="admin">{content}</DashboardLayout>;
}
