"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { pusherClient } from "@/lib/pusher";

export default function DebugPusher() {
    const [isConnected, setIsConnected] = useState(false);
    const [connectionState, setConnectionState] = useState("Not connected");
    const [isTesting, setIsTesting] = useState(false);
    const [lastMessage, setLastMessage] = useState("");
    const testChannel = "test-channel";
    const testEvent = "test-event";

    // Check Pusher connection status when component mounts
    useEffect(() => {
        // Show current connection state
        setConnectionState(pusherClient.connection.state);

        // Add event listeners for connection status changes
        const handleConnected = () => {
            setIsConnected(true);
            setConnectionState("connected");
            toast.success("Pusher connected successfully!");
        };

        const handleDisconnected = () => {
            setIsConnected(false);
            setConnectionState("disconnected");
            toast.error("Pusher disconnected");
        };

        const handleError = (error: any) => {
            console.error("Pusher connection error:", error);
            toast.error(`Pusher error: ${error.message || "Unknown error"}`);
        };

        // Subscribe to connection events
        pusherClient.connection.bind("connected", handleConnected);
        pusherClient.connection.bind("disconnected", handleDisconnected);
        pusherClient.connection.bind("error", handleError);

        // If already connected, update state
        if (pusherClient.connection.state === "connected") {
            setIsConnected(true);
        }

        // Cleanup
        return () => {
            pusherClient.connection.unbind("connected", handleConnected);
            pusherClient.connection.unbind("disconnected", handleDisconnected);
            pusherClient.connection.unbind("error", handleError);
        };
    }, []);

    // Set up a test channel and event
    useEffect(() => {
        const channel = pusherClient.subscribe(testChannel);

        const handleTestEvent = (data: any) => {
            setLastMessage(JSON.stringify(data));
            toast.success("Received Pusher test event!", {
                description: `Message: ${data.message || JSON.stringify(data)}`,
            });
        };

        channel.bind(testEvent, handleTestEvent);

        return () => {
            channel.unbind(testEvent, handleTestEvent);
            pusherClient.unsubscribe(testChannel);
        };
    }, []);

    const handleTestDummyNotification = async () => {
        try {
            // Test notification without Pusher
            toast.info("Test Toast Notification", {
                description: "This is a test notification using toast only (no Pusher)",
                duration: 5000,
            });
        } catch (error) {
            console.error("Error showing test notification:", error);
        }
    };

    const handleTestPusherConnection = () => {
        // Try to trigger a reconnection
        pusherClient.connect();
        toast.info("Attempting to connect to Pusher...");
    };

    const handleTestPusherEvent = async () => {
        setIsTesting(true);
        try {
            const response = await fetch("/api/test-pusher", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    channel: testChannel,
                    event: testEvent,
                    data: {
                        message: "Hello from Pusher test!",
                        timestamp: new Date().toISOString(),
                    },
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Failed to trigger Pusher event");
            }

            toast.info("Pusher event triggered", {
                description: "Waiting for event to be received...",
            });
        } catch (error) {
            console.error("Error triggering Pusher event:", error);
            toast.error("Failed to trigger Pusher event");
        } finally {
            setIsTesting(false);
        }
    };

    return (
        <Card className="mt-8">
            <CardHeader>
                <CardTitle>Pusher Debugging Information</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div>
                        <h3 className="font-medium mb-2">Pusher Connection Status:</h3>
                        <div className="bg-slate-100 p-3 rounded-md">
                            <div className="flex justify-between py-1">
                                <span>Connection State:</span>
                                <span className={`font-medium ${connectionState === "connected" ? "text-green-500" :
                                    connectionState === "connecting" ? "text-yellow-500" : "text-red-500"
                                    }`}>
                                    {connectionState}
                                </span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span>App Key:</span>
                                <span className="font-mono">0e7bfe8f3a925a36891a</span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span>Cluster:</span>
                                <span className="font-mono">ap2</span>
                            </div>
                            {lastMessage && (
                                <div className="pt-2 mt-2 border-t">
                                    <span className="text-sm font-medium">Last Received Message:</span>
                                    <div className="bg-slate-200 p-2 rounded mt-1 text-xs overflow-auto break-all">
                                        {lastMessage}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
                        <Button
                            onClick={handleTestPusherConnection}
                            variant="outline"
                        >
                            Test Connection
                        </Button>
                        <Button
                            onClick={handleTestPusherEvent}
                            variant="default"
                            disabled={isTesting || connectionState !== "connected"}
                        >
                            {isTesting ? "Sending..." : "Send Test Event"}
                        </Button>
                        <Button
                            onClick={handleTestDummyNotification}
                            variant="secondary"
                        >
                            Test Toast (No Pusher)
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
} 