"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Mock notification interface
interface Notification {
    id: string;
    title: string;
    message: string;
    timestamp: string;
}

export default function TestNotification() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [count, setCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    const addNotification = () => {
        const newNotification = {
            id: Date.now().toString(),
            title: `Test Notification ${count + 1}`,
            message: `This is a test notification message #${count + 1}`,
            timestamp: new Date().toISOString(),
        };

        setNotifications([newNotification, ...notifications]);
        setCount(count + 1);

        toast.success("Notification added", {
            description: "Check the notification bell",
        });
    };

    const clearNotifications = () => {
        setNotifications([]);
        setCount(0);
        toast.info("All notifications cleared");
    };

    return (
        <Card className="mt-4">
            <CardHeader>
                <CardTitle>Simple Notification Test</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Button onClick={addNotification}>
                            Add Test Notification
                        </Button>
                        <Button
                            onClick={clearNotifications}
                            variant="outline"
                            disabled={notifications.length === 0}
                        >
                            Clear All Notifications
                        </Button>
                    </div>

                    <div className="mt-4 border-t pt-4">
                        <h3 className="font-medium mb-2">Notification Preview:</h3>

                        <div className="flex items-center gap-2 mb-4">
                            <div className="relative">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="relative"
                                    onClick={() => setIsOpen(!isOpen)}
                                >
                                    <Bell className="h-5 w-5" />
                                    {count > 0 && (
                                        <Badge
                                            variant="destructive"
                                            className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs"
                                        >
                                            {count}
                                        </Badge>
                                    )}
                                </Button>

                                {isOpen && notifications.length > 0 && (
                                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-50 border">
                                        <div className="p-2 text-sm font-medium border-b">
                                            Notifications
                                        </div>
                                        <div className="max-h-60 overflow-y-auto">
                                            {notifications.map((notification) => (
                                                <div
                                                    key={notification.id}
                                                    className="p-3 border-b hover:bg-gray-50 cursor-pointer"
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div className="font-medium">{notification.title}</div>
                                                        <div className="text-xs text-gray-500">
                                                            {new Date(notification.timestamp).toLocaleTimeString()}
                                                        </div>
                                                    </div>
                                                    <div className="text-sm text-gray-600 mt-1">
                                                        {notification.message}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div
                                            className="p-2 text-center text-sm font-medium text-primary hover:bg-gray-50 cursor-pointer"
                                            onClick={clearNotifications}
                                        >
                                            Clear all
                                        </div>
                                    </div>
                                )}
                            </div>
                            <span className="ml-2">← Click the bell to test the dropdown</span>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-md">
                            <p className="text-sm text-gray-600">
                                Notes: This is a simple client-side implementation for testing the notification UI.
                                Click "Add Test Notification" to simulate receiving a new notification.
                                The count badge will update and you can click the bell to view the notifications.
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
} 