"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import { Bell, CheckCircle2, Loader2 } from "lucide-react";
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

export default function UserNotifications() {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMarkingAllAsRead, setIsMarkingAllAsRead] = useState(false);

  // Fetch notifications when component mounts
  useEffect(() => {
    if (!user?.id) return;
    
    fetchNotifications();
    
    // Setup Pusher subscriptions for real-time updates
    const userChannel = pusherClient.subscribe(getUserChannel(user.id));
    const dbUserChannel = pusherClient.subscribe(`user-db-${user.id}`);
    
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
    
    // Handle notification status updates (read/unread)
    const handleNotificationStatusUpdate = (data: any) => {
            
      if (data.action === 'read') {
        // Update the specific notification's read status
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === data.notificationId 
              ? { ...notification, isRead: true } 
              : notification
          )
        );
      } else if (data.action === 'mark-all-read') {
        // Update all notifications to be read
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, isRead: true }))
        );
      }
    };
    
    // Bind event handlers
    userChannel.bind(EVENT_TYPES.NEW_NOTIFICATION, handleNewNotification);
    dbUserChannel.bind(EVENT_TYPES.NEW_NOTIFICATION, handleNewNotification);
    
    // Bind notification status update handlers
    userChannel.bind(EVENT_TYPES.NOTIFICATION_STATUS_UPDATED, handleNotificationStatusUpdate);
    dbUserChannel.bind(EVENT_TYPES.NOTIFICATION_STATUS_UPDATED, handleNotificationStatusUpdate);
    
    // Cleanup on unmount
    return () => {
      userChannel.unbind_all();
      dbUserChannel.unbind_all();
      pusherClient.unsubscribe(getUserChannel(user.id));
      pusherClient.unsubscribe(`user-db-${user.id}`);
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
      // Show loading state
      toast.loading("Updating notification...");
      
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

      // Clear loading toast and show success
      toast.dismiss();
      toast.success("Marked as read");
      
      // No need to refresh since Pusher event will trigger the update
    } catch (error) {
      console.error("Error marking notification as read:", error);
      // Revert the local changes if there was an error
      toast.dismiss();
      toast.error("Failed to update notification");
      fetchNotifications();
    }
  };

  const markAllAsRead = async () => {
    if (!user?.id || notifications.length === 0 || isMarkingAllAsRead) return;
    
    try {
      setIsMarkingAllAsRead(true);
      toast.loading("Marking all as read...");
      
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
      
      // Clear loading toast and show success
      toast.dismiss();
      toast.success("All notifications marked as read");
      
      // No need to refresh since Pusher event will trigger the update
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      // Revert the local changes if there was an error
      toast.dismiss();
      toast.error("Failed to update notifications");
      fetchNotifications();
    } finally {
      setIsMarkingAllAsRead(false);
    }
  };

  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <DashboardLayout userRole="user">
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
            <p className="text-muted-foreground">
              Stay updated with your latest bookings, payments, and more
            </p>
          </div>
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Mark all as read
            </Button>
          )}
        </div>

        <div className="mt-8">
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
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(notification.createdAt), "MMM d, yyyy • h:mm a")}
                          </span>
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