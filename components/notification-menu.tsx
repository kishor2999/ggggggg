"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: Date;
}

interface NotificationMenuProps {
    notifications: Notification[];
    notificationCount: number;
    onMarkAsRead: (id: string) => void;
    onMarkAllAsRead: () => void;
}

export function NotificationMenu({
    notifications,
    notificationCount,
    onMarkAsRead,
    onMarkAllAsRead,
}: NotificationMenuProps) {
    const [open, setOpen] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false); // For manual control

    // Toggle manually for debugging
    const handleBellClick = () => {
        setMenuVisible(!menuVisible);
        console.log("Bell clicked, menu visible:", !menuVisible);
    };

    const handleMarkAsRead = (id: string) => {
        onMarkAsRead(id);
        // Don't close the menu when clicking an item
    };

    // Debug menu to console when open state changes
    useEffect(() => {
        if (open) {
            console.log("Menu opened via Radix state");
        }
    }, [open]);

    // Debug notification count changes
    useEffect(() => {
        console.log("Notification count:", notificationCount);
        console.log("Notifications:", notifications);
    }, [notificationCount, notifications]);

    return (
        <div className="relative">
            {/* Bell with badge */}
            <Button
                variant="outline"
                size="icon"
                className="relative"
                onClick={handleBellClick}
            >
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                    <Badge
                        variant="destructive"
                        className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs"
                    >
                        {notificationCount}
                    </Badge>
                )}
                <span className="sr-only">Toggle notifications</span>
            </Button>

            {/* Manual dropdown menu for testing */}
            {menuVisible && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-50 border">
                    <div className="p-3 font-medium border-b">
                        Notifications
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                                No notifications
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "p-4 border-b cursor-pointer hover:bg-gray-50",
                                        !notification.isRead && "bg-blue-50"
                                    )}
                                    onClick={() => handleMarkAsRead(notification.id)}
                                >
                                    <div className="flex justify-between">
                                        <span className="font-medium">{notification.title}</span>
                                        <span className="text-xs text-gray-500">
                                            {format(new Date(notification.createdAt), 'MMM d, h:mm a')}
                                        </span>
                                    </div>
                                    <span className="text-sm text-gray-600 mt-1 block">
                                        {notification.message}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                    <div
                        className="p-3 text-center text-sm font-medium text-primary hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                            onMarkAllAsRead();
                            toast.success("All notifications marked as read");
                        }}
                    >
                        Mark all as read
                    </div>
                </div>
            )}
        </div>
    );
} 