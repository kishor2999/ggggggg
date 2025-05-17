"use client";

import { DashboardLayout } from "@/components/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Car, CreditCard, User } from "lucide-react";
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
import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import fetchUserRecentServices from "@/app/actions/fetch-user-recent-services";
import fetchUserLatestPayment from "@/app/actions/fetch-user-latest-payment";
import { toast } from "sonner";
import { getUserVehicles } from "@/app/actions/vehicles";
import { updateUserProfile, getUserProfile } from "@/app/actions/users";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { SharedNotificationTest } from "@/components/shared-notification-test";
import { NotificationDebug } from "@/components/notification-debug";

interface RecentService {
  id: string;
  date: Date;
  price: string;
  status: string;
  service: {
    name: string;
  };
  staff?: {
    user: {
      name: string;
    }
  } | null;
}

interface LatestPayment {
  id: string;
  amount: string;
  createdAt: Date;
  appointment?: {
    service: {
      name: string;
    }
  } | null;
  order?: {
    id: string;
  } | null;
}

interface Vehicle {
  id: string;
  type: string;
  model: string;
  plate: string;
}

// Define form schema
const formSchema = z.object({
  phoneNumber: z.string()
    .min(10, { message: "Phone number must be 10 digits" })
    .max(10, { message: "Phone number must be 10 digits" })
    .refine(val => /^\d+$/.test(val), { message: "Phone number can only contain digits" }),
  address: z.string().min(5, { message: "Address must be at least 5 characters" }),
});

export default function UserDashboard() {
  const { isLoaded, user } = useUser();
  const [firstName, setFirstName] = useState("User");
  const [recentServices, setRecentServices] = useState<RecentService[]>([]);
  const [latestPayment, setLatestPayment] = useState<LatestPayment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [formError, setFormError] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [addressError, setAddressError] = useState("");

  // Set the user's name
  useEffect(() => {
    if (isLoaded && user) {
      setFirstName(user.firstName || user.username || "User");

      // Set phone number from Clerk if available
      if (user.phoneNumbers && user.phoneNumbers.length > 0) {
        const phone = user.phoneNumbers[0].phoneNumber.replace(/\D/g, '');
        setPhoneNumber(phone);
      }
    }
  }, [isLoaded, user]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);

        // Load recent services
        const services = await fetchUserRecentServices(3);
        setRecentServices(services);

        // Load latest payment
        const payment = await fetchUserLatestPayment();
        setLatestPayment(payment);

        // Load vehicles
        const userVehicles = await getUserVehicles();
        setVehicles(userVehicles);

        // Load user profile
        try {
          const profile = await getUserProfile();
          if (profile.phoneNumber) {
            setPhoneNumber(profile.phoneNumber);
          }
          if (profile.address) {
            setAddress(profile.address);
          }
        } catch (error) {
          console.error("Error loading user profile:", error);
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Validate phone number
  const validatePhone = (value: string) => {
    if (!value) {
      setPhoneError("Phone number is required");
      return false;
    }
    if (value.length !== 10) {
      setPhoneError("Phone number must be exactly 10 digits");
      return false;
    }
    if (!/^\d+$/.test(value)) {
      setPhoneError("Phone number can only contain digits");
      return false;
    }
    setPhoneError("");
    return true;
  };

  // Validate address
  const validateAddress = (value: string) => {
    if (!value) {
      setAddressError("Address is required");
      return false;
    }
    if (value.length < 5) {
      setAddressError("Address must be at least 5 characters");
      return false;
    }
    setAddressError("");
    return true;
  };

  // Handle phone number input
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhoneNumber(value);
    validatePhone(value);
  };

  // Handle address input
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAddress(value);
    validateAddress(value);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const isPhoneValid = validatePhone(phoneNumber);
    const isAddressValid = validateAddress(address);

    if (!isPhoneValid || !isAddressValid) {
      return;
    }

    try {
      setIsUpdating(true);

      await updateUserProfile({
        phoneNumber,
        address,
      });

      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
      setFormError("Failed to update profile. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (date: Date) => {
    return format(new Date(date), "PP");
  };

  const getPaymentDescription = () => {
    if (!latestPayment) return "No recent payments";

    if (latestPayment.appointment) {
      return `${latestPayment.appointment.service.name} - ${formatDate(latestPayment.createdAt)}`;
    } else if (latestPayment.order) {
      return `Product Order - ${formatDate(latestPayment.createdAt)}`;
    } else {
      return `Payment - ${formatDate(latestPayment.createdAt)}`;
    }
  };

  return (
    <DashboardLayout userRole="user">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Welcome, {firstName}</h1>
          <Button asChild>
            <Link href="/dashboard/user/book">
              <Calendar className="mr-2 h-4 w-4" />
              Book New Service
            </Link>
          </Button>
        </div>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Recent Payment
                </CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-6 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ) : latestPayment ? (
                  <>
                    <div className="text-xl font-bold">Rs{Number(latestPayment.amount).toFixed(2)}</div>
                    <p className="text-sm text-muted-foreground">
                      {getPaymentDescription()}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-xl font-bold">No recent payments</div>
                    <p className="text-sm text-muted-foreground">
                      Book a service or make a purchase
                    </p>
                  </>
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/dashboard/user/payments">
                    View All Payments
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Services</CardTitle>
              <CardDescription>Your recent car wash services</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-10 bg-gray-200 rounded"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              ) : recentServices.length === 0 ? (
                <div className="text-center py-8">
                  <Car className="h-12 w-12 text-muted-foreground mx-auto" />
                  <p className="mt-4 text-muted-foreground">
                    No services found. Book your first service now!
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentServices.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell className="font-medium">{service.service.name}</TableCell>
                        <TableCell>{formatDate(service.date)}</TableCell>
                        <TableCell>
                          <Badge className="bg-green-500">Completed</Badge>
                        </TableCell>
                        <TableCell>{service.staff?.user.name || "Not assigned"}</TableCell>
                        <TableCell className="text-right">Rs{Number(service.price).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/user/bookings">
                  View All Services
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Your Vehicles</CardTitle>
                <CardDescription>
                  Registered vehicles for service
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-16 bg-gray-200 rounded"></div>
                    <div className="h-16 bg-gray-200 rounded"></div>
                  </div>
                ) : vehicles.length === 0 ? (
                  <div className="text-center py-4">
                    <Car className="h-10 w-10 text-muted-foreground mx-auto" />
                    <p className="mt-2 text-muted-foreground">
                      No vehicles registered yet.
                    </p>
                  </div>
                ) : (
                  vehicles.map((vehicle) => (
                    <div key={vehicle.id} className="flex items-center gap-3 rounded-lg border p-3">
                      <Car className="h-10 w-10 text-primary" />
                      <div>
                        <h3 className="font-semibold">{vehicle.model}</h3>
                        <p className="text-sm text-muted-foreground">
                          {vehicle.type} • License: {vehicle.plate}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/dashboard/user/book">
                    Add Vehicle
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Profile</CardTitle>
                <CardDescription>
                  Update your contact information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {formError && (
                    <p className="text-sm text-red-500 mb-2">{formError}</p>
                  )}

                  <div className="grid gap-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      placeholder="10-digit phone number"
                      maxLength={10}
                      value={phoneNumber}
                      onChange={handlePhoneChange}
                    />
                    {phoneError && (
                      <p className="text-sm text-red-500">{phoneError}</p>
                    )}
                    <p className="text-xs text-muted-foreground">Must be exactly 10 digits</p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      placeholder="Your address"
                      value={address}
                      onChange={handleAddressChange}
                    />
                    {addressError && (
                      <p className="text-sm text-red-500">{addressError}</p>
                    )}
                    <p className="text-xs text-muted-foreground">Must be at least 5 characters</p>
                  </div>

                  <Button
                    type="submit"
                    disabled={isUpdating || !!phoneError || !!addressError}
                    className="w-full"
                  >
                    {isUpdating ? "Updating..." : "Update Profile"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <SharedNotificationTest dashboardType="user" />
      <NotificationDebug />
    </DashboardLayout>
  );
}
