"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  format,
  isToday,
  isTomorrow,
  addDays,
  isAfter,
  startOfDay,
  parseISO,
} from "date-fns";
import {
  Car,
  CheckCircle,
  Filter,
  Search,
  Star,
  X,
  Calendar,
  ClipboardList,
  AlertCircle,
  MapPin,
  MessageSquare,
  PlayCircle,
  CheckSquare,
  Clock,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getEmployeeTasks, updateTaskStatus } from "@/app/actions/tasks";
import { toast } from "sonner";

interface Task {
  id: string;
  service: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    notes?: string;
    rating: number;
  };
  vehicle: {
    make: string;
    model: string;
    color: string;
    licensePlate: string;
  };
  scheduledTime: Date;
  estimatedDuration: number;
  status: string;
  location: string;
  assignedBy: string;
  specialInstructions?: string;
  completedAt?: Date;
  feedback?: string;
}

export default function EmployeeTasks() {
  const { userId } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState<string>("");
  const [completionNotes, setCompletionNotes] = useState<string>("");

  // Fetch tasks on component mount
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        if (!userId) {
                    return;
        }

                const fetchedTasks = await getEmployeeTasks(userId);

        
        // Ensure dates are properly handled
        const tasksWithDates = fetchedTasks.map((task) => ({
          ...task,
          scheduledTime: new Date(task.scheduledTime),
          completedAt: task.completedAt
            ? new Date(task.completedAt)
            : undefined,
        }));

        setTasks(tasksWithDates);
      } catch (error) {
        console.error("Error fetching tasks:", error);
        toast.error("Failed to fetch tasks");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [userId]);

  // Filter tasks based on search query and status
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      !searchQuery ||
      task.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.vehicle.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.vehicle.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.service.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === "all" || task.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Sort tasks by scheduled time (earliest first)
  const sortedTasks = [...filteredTasks].sort(
    (a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime()
  );

  // Group tasks by day and status
  const today = startOfDay(new Date());

  // Today's tasks (regardless of status)
  const todayTasks = sortedTasks.filter((task) => {
    const taskDate = startOfDay(new Date(task.scheduledTime));
    return taskDate.getTime() === today.getTime();
  });

  // In-progress tasks (regardless of date)
  const inProgressTasks = sortedTasks.filter(
    (task) => task.status === "in-progress"
  );

  // Upcoming tasks (future date and not completed)
  const upcomingTasks = sortedTasks.filter((task) => {
    const taskDate = startOfDay(new Date(task.scheduledTime));
    return taskDate.getTime() > today.getTime() && task.status !== "completed";
  });

  // Completed tasks (regardless of date)
  const completedTasks = sortedTasks
    .filter((task) => task.status === "completed")
    .sort(
      (a, b) =>
        // Sort completed tasks by completion date (most recent first)
        (b.completedAt?.getTime() || 0) - (a.completedAt?.getTime() || 0)
    );

  
  // Handle task selection
  const handleSelectTask = (task: Task) => {
    setSelectedTask(task);
  };

  // Handle task update
  const handleUpdateTask = (task: Task, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedTask(task);
    setStatusUpdate(task.status);
    setCompletionNotes("");
    setIsUpdateDialogOpen(true);
  };

  // Handle status update submission
  const handleSubmitStatusUpdate = async () => {
    if (!selectedTask) return;

    try {
      await updateTaskStatus(selectedTask.id, statusUpdate, completionNotes);

      // Update local state
      setTasks(
        tasks.map((task) =>
          task.id === selectedTask.id
            ? {
              ...task,
              status: statusUpdate,
              completedAt:
                statusUpdate === "completed" ? new Date() : task.completedAt,
            }
            : task
        )
      );

      toast.success("Task status updated successfully");
      setIsUpdateDialogOpen(false);
      setSelectedTask(null);
    } catch (error) {
      console.error("Error updating task status:", error);
      toast.error("Failed to update task status");
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge variant="outline">Scheduled</Badge>;
      case "in-progress":
        return <Badge className="bg-yellow-500">In Progress</Badge>;
      case "completed":
        return <Badge className="bg-green-500">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Get time display
  const getTimeDisplay = (date: Date) => {
    if (isToday(date)) {
      return `Today, ${format(date, "h:mm a")}`;
    } else if (isTomorrow(date)) {
      return `Tomorrow, ${format(date, "h:mm a")}`;
    } else {
      return format(date, "MMM d, h:mm a");
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout userRole="employee">
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  // Task Card Component for reuse
  const TaskCard = ({ task }: { task: Task }) => (
    <Card
      key={task.id}
      className="cursor-pointer hover:bg-accent/5"
      onClick={() => handleSelectTask(task)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">
                {format(task.scheduledTime, "h:mm a")}
              </span>
              {getStatusBadge(task.status)}
            </div>
            <p className="text-sm font-medium">{task.service}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Car className="h-4 w-4" />
              <span>
                {task.vehicle.make} {task.vehicle.model}
              </span>
            </div>
          </div>
          <Button
            variant={task.status === "completed" ? "outline" : "default"}
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleUpdateTask(task);
            }}
          >
            {task.status === "scheduled"
              ? "Start"
              : task.status === "in-progress"
                ? "Complete"
                : "Update"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout userRole="employee">
      <div className="flex flex-col gap-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Tasks</h1>
            <p className="text-muted-foreground">
              Manage and track your assigned tasks
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search tasks..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Today's Tasks
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayTasks.length}</div>
              <p className="text-xs text-muted-foreground">
                {todayTasks.filter((t) => t.status === "completed").length}{" "}
                completed
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <PlayCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inProgressTasks.length}</div>
              <p className="text-xs text-muted-foreground">Active tasks</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingTasks.length}</div>
              <p className="text-xs text-muted-foreground">Future tasks</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedTasks.length}</div>
              <p className="text-xs text-muted-foreground">Finished tasks</p>
            </CardContent>
          </Card>
        </div>

        {/* Tasks Grid */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Tasks</TabsTrigger>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="in-progress">In Progress</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <div className="grid gap-4 md:grid-cols-3">
              {/* Today's Tasks */}
              <Card className="md:col-span-1">
                <CardHeader className="pb-3">
                  <CardTitle>Today</CardTitle>
                  <CardDescription>
                    {todayTasks.length} tasks scheduled
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {todayTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Calendar className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No tasks scheduled for today
                      </p>
                    </div>
                  ) : (
                    todayTasks.map((task) => (
                      <TaskCard key={task.id} task={task} />
                    ))
                  )}
                </CardContent>
              </Card>

              {/* In Progress */}
              <Card className="md:col-span-1">
                <CardHeader className="pb-3">
                  <CardTitle>In Progress</CardTitle>
                  <CardDescription>
                    {inProgressTasks.length} active tasks
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {inProgressTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <PlayCircle className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No tasks in progress
                      </p>
                    </div>
                  ) : (
                    inProgressTasks.map((task) => (
                      <TaskCard key={task.id} task={task} />
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Upcoming */}
              <Card className="md:col-span-1">
                <CardHeader className="pb-3">
                  <CardTitle>Upcoming</CardTitle>
                  <CardDescription>
                    {upcomingTasks.length} scheduled tasks
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {upcomingTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Clock className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No upcoming tasks
                      </p>
                    </div>
                  ) : (
                    upcomingTasks.map((task) => (
                      <TaskCard key={task.id} task={task} />
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="today">
            <Card>
              <CardHeader>
                <CardTitle>Today's Tasks</CardTitle>
                <CardDescription>
                  {todayTasks.length} tasks scheduled for today
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {todayTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Calendar className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No tasks scheduled for today
                      </p>
                    </div>
                  ) : (
                    todayTasks.map((task) => (
                      <TaskCard key={task.id} task={task} />
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="in-progress">
            <Card>
              <CardHeader>
                <CardTitle>In Progress Tasks</CardTitle>
                <CardDescription>
                  {inProgressTasks.length} tasks currently in progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {inProgressTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <PlayCircle className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No tasks in progress
                      </p>
                    </div>
                  ) : (
                    inProgressTasks.map((task) => (
                      <TaskCard key={task.id} task={task} />
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upcoming">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Tasks</CardTitle>
                <CardDescription>
                  {upcomingTasks.length} tasks scheduled for the future
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Clock className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No upcoming tasks
                      </p>
                    </div>
                  ) : (
                    upcomingTasks.map((task) => (
                      <TaskCard key={task.id} task={task} />
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed">
            <Card>
              <CardHeader>
                <CardTitle>Completed Tasks</CardTitle>
                <CardDescription>
                  {completedTasks.length} tasks completed successfully
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {completedTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <CheckCircle className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No completed tasks
                      </p>
                    </div>
                  ) : (
                    completedTasks.map((task) => (
                      <TaskCard key={task.id} task={task} />
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Task Details Dialog */}
      {selectedTask && (
        <Dialog
          open={!!selectedTask}
          onOpenChange={() => setSelectedTask(null)}
        >
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-auto">
            <DialogHeader>
              <div className="flex items-start justify-between">
                <div>
                  <DialogTitle>{selectedTask.service}</DialogTitle>
                  <DialogDescription>Task #{selectedTask.id}</DialogDescription>
                </div>
                {getStatusBadge(selectedTask.status)}
              </div>
            </DialogHeader>
            <div className="grid gap-6">
              <div className="flex items-center gap-4 p-4 bg-accent/5 rounded-lg">
                <Avatar className="h-16 w-16">
                  <AvatarImage
                    src="/placeholder.svg?height=64&width=64"
                    alt={selectedTask.customer.name}
                  />
                  <AvatarFallback>
                    {selectedTask.customer.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h3 className="font-semibold">
                    {selectedTask.customer.name}
                  </h3>
                  <div className="text-sm text-muted-foreground">
                    {selectedTask.customer.email}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {selectedTask.customer.phone}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4" />
                      <CardTitle className="text-sm font-medium">
                        Vehicle Details
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Make & Model
                        </span>
                        <span>
                          {selectedTask.vehicle.make}{" "}
                          {selectedTask.vehicle.model}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Color</span>
                        <span>{selectedTask.vehicle.color}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          License Plate
                        </span>
                        <span>{selectedTask.vehicle.licensePlate}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <CardTitle className="text-sm font-medium">
                        Service Details
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Scheduled Time
                        </span>
                        <span>{format(selectedTask.scheduledTime, "PPp")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Duration</span>
                        <span>{selectedTask.estimatedDuration} minutes</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Location</span>
                        <span>{selectedTask.location}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {selectedTask.specialInstructions && (
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      <CardTitle className="text-sm font-medium">
                        Special Instructions
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">
                      {selectedTask.specialInstructions}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedTask(null)}>
                Close
              </Button>
              {selectedTask.status !== "completed" && (
                <Button onClick={() => handleUpdateTask(selectedTask)}>
                  {selectedTask.status === "scheduled"
                    ? "Start Task"
                    : "Complete Task"}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Update Status Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Update Task Status</DialogTitle>
            <DialogDescription>
              {statusUpdate === "scheduled"
                ? "Update the task status"
                : statusUpdate === "in-progress"
                  ? "Mark this task as completed"
                  : "Update task status"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusUpdate} onValueChange={setStatusUpdate}>
                <SelectTrigger id="status" className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {statusUpdate === "completed" && (
              <div className="grid gap-2">
                <Label htmlFor="notes">Completion Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about the completed task"
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUpdateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitStatusUpdate}>
              {statusUpdate === "in-progress"
                ? "Start Task"
                : statusUpdate === "completed"
                  ? "Complete Task"
                  : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
