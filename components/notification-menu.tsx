"use client";

import { useSafeNavigation } from "@/components/safe-navigation-provider";
import { EVENT_TYPES, getUserChannel, pusherClient } from "@/lib/pusher";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import { format } from "date-fns";
import { Bell, ExternalLink, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: Date;
}

export function NotificationMenu() {
    const { user } = useUser();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [notificationCount, setNotificationCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const safeNavigation = useSafeNavigation();
    const safePathname = safeNavigation?.pathname || '';
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Set mounted flag when component is mounted
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        if (!isMounted) return;
        
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isMounted]);

    // Determine user role from pathname
    const getUserRole = () => {
        if (safePathname.includes('/dashboard/admin')) {
            return 'admin';
        } else if (safePathname.includes('/dashboard/employee')) {
            return 'employee';
        } else {
            return 'user';
        }
    };
    
    // Get notification page link based on user role
    const getNotificationLink = () => {
        const role = getUserRole();
        return `/dashboard/${role}/notifications`;
    };

    // Fetch notifications when component mounts or user changes
    useEffect(() => {
        if (!isMounted || !user?.id) return;
        
        const fetchNotifications = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/notifications?userId=${user.id}`);
                
                if (!response.ok) {
                    console.error(`Error fetching notifications: ${response.status} ${response.statusText}`);
                    return;
                }
                
                const data = await response.json();
                
                // Sort notifications by creation date (newest first)
                const sortedNotifications = data.sort((a: Notification, b: Notification) => 
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
                
                setNotifications(sortedNotifications);
                const unreadCount = sortedNotifications.filter((n: Notification) => !n.isRead).length;
                setNotificationCount(unreadCount);
            } catch (error) {
                console.error("Failed to fetch notifications:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();

        // Setup Pusher subscriptions for real-time updates
        const userChannel = pusherClient.subscribe(getUserChannel(user.id));
        const dbUserChannel = pusherClient.subscribe(`user-db-${user.id}`);
        
        // Handle new notification events
        const handleNewNotification = (notification: Notification) => {
            setNotifications(prev => {
                // Check if we already have this notification
                const exists = prev.some(n => n.id === notification.id);
                if (exists) return prev;
                
                // Otherwise add to state
                return [notification, ...prev];
            });
            
            // If it's not read, increment the counter
            if (!notification.isRead) {
                setNotificationCount(prev => prev + 1);
            }
            
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
                
                // Decrease the notification count
                setNotificationCount(prev => Math.max(0, prev - 1));
                
            } else if (data.action === 'mark-all-read') {
             
                // Update all notifications to be read
                setNotifications(prev => 
                    prev.map(notification => ({ ...notification, isRead: true }))
                );
                
                // Reset notification count to zero
                setNotificationCount(0);
                ('Updated all notifications to read status via Pusher');
            }
        };
        
        // Bind event handlers using EVENT_TYPES constant
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
    }, [user?.id, isMounted]);

    // Function to fetch the latest notifications
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
            const unreadCount = sortedNotifications.filter((n: Notification) => !n.isRead).length;
            setNotificationCount(unreadCount);
        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: string) => {
        if (!id) {
            console.error("Cannot mark as read: notification ID is missing");
            return;
        }

        try {
            (`Marking notification ${id} as read`);
            
            // Show loading indicator
            const toastId = toast.loading("Updating notification...");
            
            // Send request to the server first, before updating UI
            (`Sending request to: /api/notifications/${id}/read`);
            const response = await fetch(`/api/notifications/${id}/read`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            // Check if response is ok before trying to parse JSON
            if (!response.ok) {
                const errorText = await response.text();
                console.error("Server error:", errorText);
                throw new Error(`Failed to mark notification as read: ${response.status} ${response.statusText}`);
            }
            
            // Parse response data
            let responseData;
            try {
                responseData = await response.json();
               
            } catch (jsonError) {
                console.error("Error parsing response JSON:", jsonError);
                throw new Error("Invalid response from server");
            }

            // Only update UI after server confirms success
            setNotifications(prev =>
                prev.map(notification =>
                    notification.id === id ? { ...notification, isRead: true } : notification
                )
            );
            
            // Recalculate the unread count after the update
            const newUnreadCount = notifications
                .filter(n => n.id !== id || n.isRead)  // Only count as unread if it's not this notification or already read
                .filter(n => !n.isRead)
                .length;
            setNotificationCount(newUnreadCount);
            
            // Clear loading toast and show success
            toast.dismiss(toastId);
            toast.success(responseData.message || "Notification marked as read");
        } catch (error) {
            console.error("Error marking notification as read:", error);
            // Show detailed error
            toast.error(`Failed to update notification: ${error instanceof Error ? error.message : 'Unknown error'}`);
            
            // Refresh to ensure UI is in sync with server
            await fetchNotifications();
        }
    };

    const markAllAsRead = async () => {
        if (!user?.id) {
            console.error("Cannot mark all as read: user ID is missing");
            toast.error("Authentication error. Please try again later.");
            return;
        }
        
        // Only proceed if there are unread notifications
        if (notificationCount <= 0) {
            ("No unread notifications to mark as read");
            return;
        }
        
        try {
            
            
            // Show loading indicator  
            const toastId = toast.loading("Marking all as read...");
            
            // Then update on the server first

            const response = await fetch(`/api/notifications/mark-all-read?userId=${user.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            // Check if response is ok before trying to parse JSON
            if (!response.ok) {
                const errorText = await response.text();
                console.error("Server error:", errorText);
                throw new Error(`Failed to mark all notifications as read: ${response.status} ${response.statusText}`);
            }
            
            // Parse response data
            let responseData;
            try {
                responseData = await response.json();
                
            } catch (jsonError) {
                console.error("Error parsing response JSON:", jsonError);
                throw new Error("Invalid response from server");
            }

            // Only update UI after server confirms success
            setNotifications(prev =>
                prev.map(notification => ({ ...notification, isRead: true }))
            );
            setNotificationCount(0);
            
            // Clear loading toast and show success
            toast.dismiss(toastId);
            toast.success(responseData.message || "All notifications marked as read");
            
            // Refresh notifications to ensure UI is in sync with server
            await fetchNotifications();
        } catch (error) {
            console.error("Error marking all notifications as read:", error);
            // Show detailed error
            toast.error(`Failed to update notifications: ${error instanceof Error ? error.message : 'Unknown error'}`);
            await fetchNotifications();
        }
    };

    const toggleDropdown = () => {
        if (!isOpen) {
            fetchNotifications();
        }
        setIsOpen(!isOpen);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Notification Bell Button */}
            <button
                onClick={toggleDropdown}
                className="relative flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                aria-label="Toggle notifications"
            >
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                    <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-white">
                        {notificationCount}
                    </div>
                )}
            </button>

            {/* Dropdown Menu - Only render when mounted */}
            {isOpen && isMounted && (
                <div className="absolute right-0 z-50 mt-2 w-80 rounded-md border border-border bg-card shadow-lg">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b p-2">
                        <h3 className="text-sm font-medium">Notifications</h3>
                        {notificationCount > 0 && (
                            <button
                                onClick={() => markAllAsRead()}
                                className="h-8 rounded-md px-2 text-xs text-muted-foreground hover:bg-accent hover:text-foreground font-medium"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    {/* Notification List */}
                    <div className="max-h-[350px] overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center p-4">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                No notifications
                            </div>
                        ) : (
                            <>
                                {notifications.map((notification) => (
                                    <button
                                        key={notification.id}
                                        className={cn(
                                            "w-full border-b last:border-b-0 text-left p-3 flex flex-col items-start hover:bg-muted/50 transition-colors",
                                            !notification.isRead && "bg-blue-50"
                                        )}
                                        onClick={() => markAsRead(notification.id)}
                                    >
                                        <div className="flex justify-between w-full">
                                            <span className="font-medium">{notification.title}</span>
                                            <span className="text-xs text-gray-500">
                                                {format(new Date(notification.createdAt), 'MMM d, h:mm a')}
                                            </span>
                                        </div>
                                        <span className="mt-1 text-sm text-gray-600">
                                            {notification.message}
                                        </span>
                                    </button>
                                ))}
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="border-t p-2">
                        <Link
                            href={getNotificationLink()}
                            className="flex w-full items-center justify-center rounded-md p-2 text-sm hover:bg-accent"
                            onClick={() => setIsOpen(false)}
                        >
                            <span>View all notifications</span>
                            <ExternalLink className="ml-2 h-4 w-4" />
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
} 