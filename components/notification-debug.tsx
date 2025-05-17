"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { pusherClient } from "@/lib/pusher";
import { useUser } from "@clerk/nextjs";

export function NotificationDebug() {
    const { user } = useUser();
    const [dbUser, setDbUser] = useState<any>(null);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchUserData() {
            if (!user) return;

            setIsLoading(true);
            setError(null);

            try {
                // Fetch the database user that corresponds to the Clerk user
                const response = await fetch('/api/users/current');
                if (!response.ok) {
                    throw new Error('Failed to fetch user data');
                }

                const userData = await response.json();
                setDbUser(userData);

                // Fetch notifications for this user
                if (userData.id) {
                    const notifResponse = await fetch(`/api/notifications?userId=${userData.id}`);
                    if (notifResponse.ok) {
                        const notifData = await notifResponse.json();
                        setNotifications(notifData);
                    }
                }
            } catch (err: any) {
                console.error("Error fetching user data:", err);
                setError(err.message || 'An error occurred');
            } finally {
                setIsLoading(false);
            }
        }

        fetchUserData();
    }, [user]);

    // Helper function to send a test notification to the current user
    const sendTestNotification = async () => {
        if (!dbUser) {
            toast.error("User not found in database");
            return;
        }

        try {
            const response = await fetch('/api/test-notification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userRole: dbUser.role.toLowerCase(),
                    userId: dbUser.id
                }),
            });

            if (response.ok) {
                const result = await response.json();
                toast.success(`Notification sent to you (ID: ${result.userId})`);

                // Refresh notifications after a slight delay
                setTimeout(async () => {
                    const notifResponse = await fetch(`/api/notifications?userId=${dbUser.id}`);
                    if (notifResponse.ok) {
                        const notifData = await notifResponse.json();
                        setNotifications(notifData);
                    }
                }, 1000);
            } else {
                const errorData = await response.json();
                toast.error(`Failed: ${errorData.error || 'Unknown error'}`);
            }
        } catch (err) {
            console.error("Error sending notification:", err);
            toast.error("Failed to send notification");
        }
    };

    return (
        <Card className="mt-4">
            <CardHeader>
                <CardTitle>Notification System Debug</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="bg-gray-100 p-4 rounded-md">
                        <h3 className="font-medium mb-2">Auth User Information:</h3>
                        {user ? (
                            <div>
                                <p><strong>Clerk ID:</strong> {user.id}</p>
                                <p><strong>Name:</strong> {user.fullName || 'N/A'}</p>
                                <p><strong>Email:</strong> {user.primaryEmailAddress?.emailAddress || 'N/A'}</p>
                            </div>
                        ) : (
                            <p>Not authenticated with Clerk</p>
                        )}
                    </div>

                    <div className="bg-gray-100 p-4 rounded-md">
                        <h3 className="font-medium mb-2">Database User Information:</h3>
                        {isLoading ? (
                            <p>Loading...</p>
                        ) : error ? (
                            <p className="text-red-500">{error}</p>
                        ) : dbUser ? (
                            <div>
                                <p><strong>Database ID:</strong> {dbUser.id}</p>
                                <p><strong>Name:</strong> {dbUser.name || 'N/A'}</p>
                                <p><strong>Role:</strong> {dbUser.role || 'N/A'}</p>
                            </div>
                        ) : (
                            <p className="text-amber-500">Your Clerk account is not linked to a database user</p>
                        )}
                    </div>

                    <div className="bg-gray-100 p-4 rounded-md">
                        <h3 className="font-medium mb-2">Recent Notifications ({notifications.length}):</h3>
                        {notifications.length > 0 ? (
                            <div className="max-h-40 overflow-y-auto space-y-2">
                                {notifications.map(notif => (
                                    <div key={notif.id} className={`p-2 border rounded-md ${notif.isRead ? 'bg-white' : 'bg-blue-50'}`}>
                                        <div className="flex justify-between">
                                            <span className="font-medium">{notif.title}</span>
                                            <span className="text-xs text-gray-500">
                                                {new Date(notif.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-sm mt-1">{notif.message}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p>No notifications found</p>
                        )}
                    </div>

                    <div className="flex space-x-2">
                        <Button onClick={sendTestNotification} disabled={!dbUser}>
                            Send Test Notification to Yourself
                        </Button>
                    </div>

                    <div className="flex space-x-2 mt-4">
                        <Button
                            onClick={() => {
                                console.log("Current notifications:", notifications);
                                toast.info(`${notifications.length} notifications available`);
                            }}
                            variant="outline"
                        >
                            Debug Notifications
                        </Button>

                        <Button
                            onClick={() => {
                                // Check if Pusher is working by logging the connection
                                console.log("Pusher connection status:", pusherClient.connection.state);
                                toast.info(`Pusher: ${pusherClient.connection.state}`);
                            }}
                            variant="outline"
                        >
                            Check Pusher
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
} 