"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard-layout";

export default function DebugNotifications() {
  const { user } = useUser();
  const [title, setTitle] = useState("Debug Notification");
  const [message, setMessage] = useState("This is a test notification to debug the notification system.");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const sendTestNotification = async () => {
    if (!user) {
      toast.error("You need to be logged in to send test notifications");
      return;
    }

    try {
      setLoading(true);
      setResult(null);

      const response = await fetch("/api/debug-notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          message,
          userId: user.id,
        }),
      });

      const data = await response.json();
      
      setResult(data);
      
      if (response.ok) {
        toast.success("Test notification sent successfully!");
      } else {
        toast.error("Failed to send test notification");
      }
    } catch (error) {
      console.error("Error sending test notification:", error);
      toast.error("An error occurred while sending the test notification");
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    if (!user) {
      toast.error("You need to be logged in to fetch notifications");
      return;
    }

    try {
      setLoading(true);
      setResult(null);

      const response = await fetch(`/api/notifications?userId=${user.id}`);
      const data = await response.json();
      
      setResult(data);
      
      if (response.ok) {
        toast.success(`Retrieved ${data.length} notifications`);
      } else {
        toast.error("Failed to fetch notifications");
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("An error occurred while fetching notifications");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout userRole="user">
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold mb-6">Notification Testing Tools</h1>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Send Test Notification</CardTitle>
              <CardDescription>
                Create a test notification to debug the notification system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Notification Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter notification title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Notification Message</Label>
                <Input
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter notification message"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={sendTestNotification} 
                disabled={loading}
                className="w-full"
              >
                {loading ? "Sending..." : "Send Test Notification"}
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notification Actions</CardTitle>
              <CardDescription>
                Tools to debug and test notification functionality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={fetchNotifications} 
                disabled={loading} 
                variant="outline" 
                className="w-full"
              >
                {loading ? "Loading..." : "Fetch My Notifications"}
              </Button>
            </CardContent>
            <CardFooter className="flex-col items-start">
              <p className="text-sm font-medium mb-2">User ID: {user?.id || "Not logged in"}</p>
              {result && (
                <div className="w-full mt-4">
                  <p className="text-sm font-medium mb-2">Result:</p>
                  <div className="bg-muted p-3 rounded-md overflow-auto max-h-[200px] text-xs">
                    <pre>{JSON.stringify(result, null, 2)}</pre>
                  </div>
                </div>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
} 