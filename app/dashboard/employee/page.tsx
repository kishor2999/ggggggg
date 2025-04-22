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
import { Calendar, Car, CheckCircle, Clock, Star, User } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function EmployeeDashboard() {
  return (
    <DashboardLayout userRole="employee">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">
            Employee Dashboard
          </h1>
          <div className="flex items-center gap-2">
            <Button>
              <CheckCircle className="mr-2 h-4 w-4" />
              Complete Task
            </Button>
            <Button variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              View Schedule
            </Button>
          </div>
        </div>

        <Tabs defaultValue="today" className="space-y-4">
          <TabsList>
            <TabsTrigger value="today">Today's Tasks</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Assigned Tasks
                  </CardTitle>
                  <Car className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">8</div>
                  <p className="text-xs text-muted-foreground">
                    3 completed, 5 remaining
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Next Task
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">10:30 AM</div>
                  <p className="text-xs text-muted-foreground">
                    Premium Wash - James Wilson
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Customer Rating
                  </CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">4.8/5.0</div>
                  <p className="text-xs text-muted-foreground">
                    Based on 142 reviews
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Work Hours
                  </CardTitle>
                  <User className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">32.5 hrs</div>
                  <p className="text-xs text-muted-foreground">
                    This week (40 hr target)
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Today's Schedule</CardTitle>
                <CardDescription>Your assigned tasks for today</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">9:00 AM</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src="/placeholder-user.jpg"
                              alt="Robert Davis"
                            />
                            <AvatarFallback>RD</AvatarFallback>
                          </Avatar>
                          <span>Robert Davis</span>
                        </div>
                      </TableCell>
                      <TableCell>Basic Wash</TableCell>
                      <TableCell>Honda Civic (Blue)</TableCell>
                      <TableCell>
                        <Badge className="bg-green-500">Completed</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">10:30 AM</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src="/placeholder-user.jpg"
                              alt="James Wilson"
                            />
                            <AvatarFallback>JW</AvatarFallback>
                          </Avatar>
                          <span>James Wilson</span>
                        </div>
                      </TableCell>
                      <TableCell>Premium Wash</TableCell>
                      <TableCell>BMW X5 (Black)</TableCell>
                      <TableCell>
                        <Badge className="bg-yellow-500">In Progress</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">1:15 PM</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src="/placeholder-user.jpg"
                              alt="Emily Brown"
                            />
                            <AvatarFallback>EB</AvatarFallback>
                          </Avatar>
                          <span>Emily Brown</span>
                        </div>
                      </TableCell>
                      <TableCell>Full Detail</TableCell>
                      <TableCell>Tesla Model 3 (White)</TableCell>
                      <TableCell>
                        <Badge>Scheduled</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">3:00 PM</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src="/placeholder-user.jpg"
                              alt="Sarah Johnson"
                            />
                            <AvatarFallback>SJ</AvatarFallback>
                          </Avatar>
                          <span>Sarah Johnson</span>
                        </div>
                      </TableCell>
                      <TableCell>Interior Clean</TableCell>
                      <TableCell>Toyota Camry (Silver)</TableCell>
                      <TableCell>
                        <Badge>Scheduled</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">4:30 PM</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage
                              src="/placeholder-user.jpg"
                              alt="Michael Thompson"
                            />
                            <AvatarFallback>MT</AvatarFallback>
                          </Avatar>
                          <span>Michael Thompson</span>
                        </div>
                      </TableCell>
                      <TableCell>Deluxe Wash</TableCell>
                      <TableCell>Audi Q7 (Gray)</TableCell>
                      <TableCell>
                        <Badge>Scheduled</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Performance</CardTitle>
                  <CardDescription>
                    Your performance metrics for today
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">
                        Task Completion
                      </span>
                      <span className="text-sm font-medium">3/8</span>
                    </div>
                    <Progress value={37.5} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">
                        Customer Satisfaction
                      </span>
                      <span className="text-sm font-medium">95%</span>
                    </div>
                    <Progress value={95} className="h-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">Efficiency</span>
                      <span className="text-sm font-medium">87%</span>
                    </div>
                    <Progress value={87} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Feedback</CardTitle>
                  <CardDescription>Latest customer reviews</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src="/placeholder-user.jpg"
                          alt="Robert Davis"
                        />
                        <AvatarFallback>RD</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">Robert Davis</h3>
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 Rs{star <= 5 ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      "Great service! My car looks brand new. Very thorough and
                      professional."
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src="/placeholder-user.jpg"
                          alt="Emily Brown"
                        />
                        <AvatarFallback>EB</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">Emily Brown</h3>
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 Rs{star <= 4 ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      "Very happy with the interior cleaning. Prompt and
                      efficient service."
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Upcoming Schedule</h2>
              <p>Your upcoming tasks would be displayed here.</p>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Performance Metrics</h2>
              <p>Your detailed performance metrics would be displayed here.</p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
