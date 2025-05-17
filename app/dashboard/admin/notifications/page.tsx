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
import { pusherClient, getUserChannel, getAdminChannel, EVENT_TYPES } from "@/lib/pusher";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Helper function to safely format dates
const safeFormatDate = (dateValue: any): string => {
  if (!dateValue) return "Unknown date";
  try {
    const date = new Date(dateValue);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "Invalid date";
    }
    return format(date, "MMM d, yyyy • h:mm a");
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Invalid date";
  }
};

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: Date;
}

export default function AdminNotifications() {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch notifications when component mounts
  useEffect(() => {
    if (!user?.id) return;
    
    fetchNotifications();
    
    // Setup Pusher subscriptions for real-time updates
    const userChannel = pusherClient.subscribe(getUserChannel(user.id));
    const adminChannel = pusherClient.subscribe(getAdminChannel());
    
    // Handle new notification events
    const handleNewNotification = (notification: Notification) => {
      console.log("New notification received:", notification);
      
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
    adminChannel.bind(EVENT_TYPES.NEW_NOTIFICATION, handleNewNotification);
    
    // Cleanup on unmount
    return () => {
      userChannel.unbind_all();
      adminChannel.unbind_all();
      pusherClient.unsubscribe(getUserChannel(user.id));
      pusherClient.unsubscribe(getAdminChannel());
    };
  }, [user?.id]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      if (!user?.id) {
        console.error("No user ID available");
        return;
      }
      
      console.log(`Fetching notifications for admin with clerk ID: ${user.id}`);
      
      const response = await fetch(`/api/notifications?userId=${user.id}`);
      
      if (!response.ok) {
        console.error(`Error fetching notifications: ${response.status} ${response.statusText}`);
        throw new Error("Failed to fetch notifications");
      }
      
      const data = await response.json();
      console.log(`Received ${data.length} notifications from API:`, data.map((n: Notification) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        isRead: n.isRead
      })));
      
      // Process notifications to ensure all fields are valid
      const processedData = data.map((notification: any) => {
        // Ensure createdAt is a valid date or set to current time if invalid
        let createdAt;
        try {
          createdAt = notification.createdAt ? new Date(notification.createdAt) : new Date();
          // If date is invalid (returns NaN for getTime), use current time
          if (isNaN(createdAt.getTime())) {
            console.warn(`Invalid date found for notification ${notification.id}, using current time`);
            createdAt = new Date();
          }
        } catch (error) {
          console.warn(`Error parsing date for notification ${notification.id}, using current time:`, error);
          createdAt = new Date();
        }
        
        return {
          ...notification,
          createdAt,
          // Ensure type is a string to prevent errors when filtering
          type: notification.type || "UNKNOWN"
        };
      });
      
      // Sort notifications by creation date (newest first)
      const sortedNotifications = processedData.sort((a: Notification, b: Notification) => {
        try {
          return b.createdAt.getTime() - a.createdAt.getTime();
        } catch (error) {
          console.error("Error sorting dates:", error);
          return 0;
        }
      });
      
      setNotifications(sortedNotifications);
      
      // Log filtered notifications
      const bookingNotifs = sortedNotifications.filter((n: Notification) => 
        n.type === "APPOINTMENT" || 
        n.type === "BOOKING" || 
        (n.type && n.type.includes("BOOKING"))
      );
      console.log(`Found ${bookingNotifs.length} booking notifications`);
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

  // Filter notifications by type
  const bookingNotifications = notifications.filter((n: Notification) => {
    const type = n.type || "";
    return type === "APPOINTMENT" || 
           type === "BOOKING" || 
           type.includes("BOOKING");
  });
  
  const paymentNotifications = notifications.filter((n: Notification) => {
    const type = n.type || "";
    return type === "PAYMENT";
  });
  
  const systemNotifications = notifications.filter((n: Notification) => {
    const type = n.type || "";
    return type === "SYSTEM" || type === "TEST";
  });
  
  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <DashboardLayout userRole="admin">
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Notifications</h1>
            <p className="text-muted-foreground">
              Manage system notifications, alerts, and updates
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

        <div className="mt-8">
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">
                All
                {unreadCount > 0 && (
                  <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    {unreadCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="bookings">
                Bookings
                {bookingNotifications.filter(n => !n.isRead).length > 0 && (
                  <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    {bookingNotifications.filter(n => !n.isRead).length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="payments">
                Payments
                {paymentNotifications.filter(n => !n.isRead).length > 0 && (
                  <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    {paymentNotifications.filter(n => !n.isRead).length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="system">
                System
                {systemNotifications.filter(n => !n.isRead).length > 0 && (
                  <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    {systemNotifications.filter(n => !n.isRead).length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-6">
              <NotificationList 
                notifications={notifications} 
                loading={loading} 
                markAsRead={markAsRead}
              />
            </TabsContent>
            
            <TabsContent value="bookings" className="mt-6">
              <NotificationList 
                notifications={bookingNotifications} 
                loading={loading} 
                markAsRead={markAsRead}
                emptyMessage="No booking notifications"
              />
            </TabsContent>
            
            <TabsContent value="payments" className="mt-6">
              <NotificationList 
                notifications={paymentNotifications} 
                loading={loading} 
                markAsRead={markAsRead}
                emptyMessage="No payment notifications"
              />
            </TabsContent>
            
            <TabsContent value="system" className="mt-6">
              <NotificationList 
                notifications={systemNotifications} 
                loading={loading} 
                markAsRead={markAsRead}
                emptyMessage="No system notifications"
              />
            </TabsContent>
          </Tabs>
        </div>
        
       
      </div>
    </DashboardLayout>
  );
}

// Helper component for rendering the notification list
function NotificationList({ 
  notifications, 
  loading, 
  markAsRead,
  emptyMessage = "No notifications yet" 
}: { 
  notifications: Notification[];
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  emptyMessage?: string;
}) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Bell className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">{emptyMessage}</h3>
          <p className="text-muted-foreground">
            When you receive notifications, they will appear here
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
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
                    {safeFormatDate(notification.createdAt)}
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
  );
} 