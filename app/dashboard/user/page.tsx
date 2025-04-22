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
import { Calendar, Car, Clock, CreditCard, Star, ThumbsUp } from "lucide-react";
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
import { Progress } from "@/components/ui/progress";

export default function UserDashboard() {
  return (
    <DashboardLayout userRole="user">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Welcome, Sarah</h1>
          <Button>
            <Calendar className="mr-2 h-4 w-4" />
            Book New Service
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="bookings">My Bookings</TabsTrigger>
            <TabsTrigger value="loyalty">Loyalty Program</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Next Appointment
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">Premium Wash</div>
                  <p className="text-sm text-muted-foreground">
                    Tomorrow, 10:30 AM
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" className="w-full">
                    View Details
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Loyalty Points
                  </CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">320 points</div>
                  <p className="text-sm text-muted-foreground">Silver Member</p>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span>320 points</span>
                      <span>500 points (Gold)</span>
                    </div>
                    <Progress value={64} className="h-2" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" className="w-full">
                    View Benefits
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Recent Payment
                  </CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">Rs69.99</div>
                  <p className="text-sm text-muted-foreground">
                    Deluxe Wash - May 15, 2023
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" className="w-full">
                    View Receipt
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
                    <TableRow>
                      <TableCell className="font-medium">Deluxe Wash</TableCell>
                      <TableCell>May 15, 2023</TableCell>
                      <TableCell>
                        <Badge className="bg-green-500">Completed</Badge>
                      </TableCell>
                      <TableCell>Mike Johnson</TableCell>
                      <TableCell className="text-right">Rs69.99</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">
                        Interior Clean
                      </TableCell>
                      <TableCell>April 28, 2023</TableCell>
                      <TableCell>
                        <Badge className="bg-green-500">Completed</Badge>
                      </TableCell>
                      <TableCell>Lisa Smith</TableCell>
                      <TableCell className="text-right">Rs39.99</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">
                        Premium Wash
                      </TableCell>
                      <TableCell>April 10, 2023</TableCell>
                      <TableCell>
                        <Badge className="bg-green-500">Completed</Badge>
                      </TableCell>
                      <TableCell>John Miller</TableCell>
                      <TableCell className="text-right">Rs49.99</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm">
                  View All Services
                </Button>
              </CardFooter>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Special Offers</CardTitle>
                  <CardDescription>Exclusive deals for you</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                      <ThumbsUp className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">20% Off Full Detail</h3>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Use code DETAIL20 when booking. Valid until June 30.
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                      <ThumbsUp className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">Free Interior Clean</h3>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      With any Deluxe Wash purchase. Valid until June 15.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Your Vehicles</CardTitle>
                  <CardDescription>
                    Registered vehicles for service
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 rounded-lg border p-3">
                    <Car className="h-10 w-10 text-primary" />
                    <div>
                      <h3 className="font-semibold">Tesla Model 3</h3>
                      <p className="text-sm text-muted-foreground">
                        White • License: ABC123
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg border p-3">
                    <Car className="h-10 w-10 text-primary" />
                    <div>
                      <h3 className="font-semibold">Honda Accord</h3>
                      <p className="text-sm text-muted-foreground">
                        Black • License: XYZ789
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm">
                    Add Vehicle
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">My Bookings</h2>
              <p>Your booking history would be displayed here.</p>
            </Card>
          </TabsContent>

          <TabsContent value="loyalty" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Loyalty Program</h2>
              <p>Your loyalty program details would be displayed here.</p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
