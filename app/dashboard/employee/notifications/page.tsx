"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import { Bell, CheckCircle2, Clock, Loader2, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { pusherClient, getUserChannel, EVENT_TYPES } from "@/lib/pusher";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: Date;
}

export default function EmployeeNotifications() {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch notifications when component mounts
  useEffect(() => {
    if (!user?.id) return;
    
    fetchNotifications();
    
    // Setup Pusher subscriptions for real-time updates
    const userChannel = pusherClient.subscribe(getUserChannel(user.id));
    const employeeChannel = pusherClient.subscribe(`employee-${user.id}`);
    
    // Handle new notification events
    const handleNewNotification = (notification: Notification) => {
            
      // Check if we already have this notification
      const exists = notifications.some(n => n.id === notification.id);
      if (exists) {
        return;
      }
      
      // Add to state
      setNotifications(prev => [notification, ...prev]);
      
      // Show toast notification
      toast.info(notification.title, {
        description: notification.message,
        duration: 5000,
      });
    };
    
    // Bind event handlers
    userChannel.bind(EVENT_TYPES.NEW_NOTIFICATION, handleNewNotification);
    employeeChannel.bind(EVENT_TYPES.NEW_NOTIFICATION, handleNewNotification);
    employeeChannel.bind(EVENT_TYPES.TASK_ASSIGNED, handleNewNotification);
    
    // Cleanup on unmount
    return () => {
      userChannel.unbind_all();
      employeeChannel.unbind_all();
      pusherClient.unsubscribe(getUserChannel(user.id));
      pusherClient.unsubscribe(`employee-${user.id}`);
    };
  }, [user?.id]);

  const fetchNotifications = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/notifications?userId=${user.id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Sort notifications by creation date (newest first)
      const sortedNotifications = data.sort((a: Notification, b: Notification) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setNotifications(sortedNotifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      // Update locally first for better UX
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === id ? { ...notification, isRead: true } : notification
        )
      );

      // Then update on the server
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT'
      });

      if (!response.ok) {
        throw new Error("Failed to mark notification as read");
      }

      toast.success("Marked as read");
    } catch (error) {
      console.error("Error marking notification as read:", error);
      // Revert the local changes if there was an error
      fetchNotifications();
    }
  };

  const markAllAsRead = async () => {
    if (!user?.id || notifications.length === 0) return;
    
    try {
      // Update locally first for better UX
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, isRead: true }))
      );

      // Then update on the server
      const response = await fetch(`/api/notifications/mark-all-read?userId=${user.id}`, {
        method: 'PUT'
      });

      if (!response.ok) {
        throw new Error("Failed to mark all notifications as read");
      }
      
      toast.success("All notifications marked as read");
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      // Revert the local changes if there was an error
      fetchNotifications();
    }
  };

  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.isRead).length;
  
  // Task notifications are important for employees
  const taskNotifications = notifications.filter(n => 
    n.type === "TASK_ASSIGNED" || 
    n.title.toLowerCase().includes("task") || 
    n.title.toLowerCase().includes("assigned")
  );
  
  const hasUnreadTasks = taskNotifications.some(n => !n.isRead);

  return (
    <DashboardLayout userRole="employee">
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
            <p className="text-muted-foreground">
              Stay updated with your assignments and tasks
            </p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={fetchNotifications} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            {unreadCount > 0 && (
              <Button onClick={markAllAsRead}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Mark all as read
              </Button>
            )}
          </div>
        </div>

        {/* Task Notifications (High Priority) */}
        {taskNotifications.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              Task Assignments
              {hasUnreadTasks && (
                <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full">
                  New Tasks
                </span>
              )}
            </h2>
            <div className="space-y-4">
              {taskNotifications.map((notification) => (
                <Card 
                  key={notification.id}
                  className={cn(
                    "transition-all hover:shadow-md border-l-4",
                    !notification.isRead ? "border-l-red-500" : "border-l-green-500"
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-lg">{notification.title}</h3>
                          {!notification.isRead && (
                            <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
                              New Task
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-4 mt-4">
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Clock className="mr-1 h-3 w-3" />
                            {format(new Date(notification.createdAt), "MMM d, yyyy • h:mm a")}
                          </div>
                        </div>
                      </div>
                      {!notification.isRead && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                        >
                          Mark as read
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Other Notifications */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">All Notifications</h2>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : notifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium mb-2">No notifications yet</h3>
                <p className="text-muted-foreground">
                  When you receive notifications, they will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <Card 
                  key={notification.id}
                  className={cn(
                    "transition-all hover:shadow-md",
                    !notification.isRead && "border-l-4 border-l-primary"
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-lg">{notification.title}</h3>
                          {!notification.isRead && (
                            <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground mt-1">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-4 mt-4">
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Clock className="mr-1 h-3 w-3" />
                            {format(new Date(notification.createdAt), "MMM d, yyyy • h:mm a")}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            Type: {notification.type}
                          </span>
                        </div>
                      </div>
                      {!notification.isRead && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                        >
                          Mark as read
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
} 