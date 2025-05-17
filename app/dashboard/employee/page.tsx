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
import { Car } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";

// Task interface
interface Task {
  id: string;
  time: string;
  customer: {
    name: string;
    avatar?: string;
    initials: string;
  };
  service: string;
  vehicle: string;
  status: "completed" | "in-progress" | "scheduled";
}

export default function EmployeeDashboard() {
  // State for tasks data
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch tasks data
  useEffect(() => {
    // In a real implementation, this would fetch from an API endpoint
    const fetchTasks = async () => {
      setLoading(true);
      try {
        // In a real app, this would be replaced with an actual API call:
        // const response = await fetch('/api/employee/tasks');
        // const data = await response.json();
        // setTasks(data);

        // For now, simulating an empty response or connection to an empty database
        setTasks([]);
        setCompletedTasks(0);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  // Helper to render badge based on status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">Completed</Badge>;
      case "in-progress":
        return <Badge className="bg-yellow-500">In Progress</Badge>;
      default:
        return <Badge>Scheduled</Badge>;
    }
  };

  return (
    <DashboardLayout userRole="employee">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">
            Employee Dashboard
          </h1>
        </div>

        <Tabs defaultValue="today" className="space-y-4">
          <TabsList>
            <TabsTrigger value="today">Today's Tasks</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-1">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Assigned Tasks
                  </CardTitle>
                  <Car className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="py-2">Loading...</div>
                  ) : tasks.length > 0 ? (
                    <>
                      <div className="text-2xl font-bold">{tasks.length}</div>
                      <p className="text-xs text-muted-foreground">
                        {completedTasks} completed, {tasks.length - completedTasks} remaining
                      </p>
                    </>
                  ) : (
                    <div className="text-muted-foreground">No tasks assigned</div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Today's Schedule</CardTitle>
                <CardDescription>Your assigned tasks for today</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="py-8 text-center">Loading schedule...</div>
                ) : tasks.length > 0 ? (
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
                      {tasks.map((task) => (
                        <TableRow key={task.id}>
                          <TableCell className="font-medium">{task.time}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  src="/placeholder-user.jpg"
                                  alt={task.customer.name}
                                />
                                <AvatarFallback>{task.customer.initials}</AvatarFallback>
                              </Avatar>
                              <span>{task.customer.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>{task.service}</TableCell>
                          <TableCell>{task.vehicle}</TableCell>
                          <TableCell>
                            {getStatusBadge(task.status)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="py-12 text-center border rounded-lg">
                    <p className="text-muted-foreground font-medium">No tasks scheduled for today</p>
                    <p className="text-sm text-muted-foreground mt-1">Check back later or contact your supervisor</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Upcoming Schedule</h2>
              <p>Your upcoming tasks would be displayed here.</p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
