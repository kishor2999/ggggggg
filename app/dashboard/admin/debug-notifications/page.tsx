"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminDebugNotifications() {
  const { user } = useUser();
  const [title, setTitle] = useState("Admin Test Notification");
  const [message, setMessage] = useState("This is a test notification from the admin dashboard.");
  const [targetUser, setTargetUser] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [result, setResult] = useState<any>(null);
  const [notificationType, setNotificationType] = useState("TEST");

  // Load users for the dropdown
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await fetch("/api/admin/users");
      const data = await response.json();
      
      if (response.ok) {
        setUsers(data);
      } else {
        toast.error("Failed to load users");
      }
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("An error occurred while loading users");
    } finally {
      setLoadingUsers(false);
    }
  };

  // Send notification to a specific user
  const sendUserNotification = async () => {
    if (!targetUser) {
      toast.error("Please select a user");
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
          userId: targetUser,
          type: notificationType,
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

  // Send notification to self (admin user)
  const sendSelfNotification = async () => {
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
          type: notificationType,
        }),
      });

      const data = await response.json();
      
      setResult(data);
      
      if (response.ok) {
        toast.success("Test notification sent to yourself!");
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

  return (
    <DashboardLayout userRole="admin">
      <div className="container mx-auto py-10">
        <h1 className="text-2xl font-bold mb-6">Admin Notification Testing Tools</h1>
        
        <Tabs defaultValue="self">
          <TabsList className="mb-6">
            <TabsTrigger value="self">Self Test</TabsTrigger>
            <TabsTrigger value="user" onClick={fetchUsers}>Send to User</TabsTrigger>
          </TabsList>
          
          <TabsContent value="self">
            <Card>
              <CardHeader>
                <CardTitle>Send Test Notification to Yourself</CardTitle>
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
                <div className="space-y-2">
                  <Label htmlFor="type">Notification Type</Label>
                  <Select 
                    value={notificationType} 
                    onValueChange={setNotificationType}
                  >
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select notification type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TEST">Test</SelectItem>
                      <SelectItem value="APPOINTMENT">Appointment</SelectItem>
                      <SelectItem value="PAYMENT">Payment</SelectItem>
                      <SelectItem value="SYSTEM">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={sendSelfNotification} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? "Sending..." : "Send Test Notification to Yourself"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="user">
            <Card>
              <CardHeader>
                <CardTitle>Send Test Notification to User</CardTitle>
                <CardDescription>
                  Send a notification to any user in the system
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="targetUser">Select User</Label>
                  <Select 
                    value={targetUser} 
                    onValueChange={setTargetUser}
                  >
                    <SelectTrigger id="targetUser">
                      <SelectValue placeholder={loadingUsers ? "Loading users..." : "Select a user"} />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.clerkId || user.id}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title-user">Notification Title</Label>
                  <Input
                    id="title-user"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter notification title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message-user">Notification Message</Label>
                  <Input
                    id="message-user"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Enter notification message"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type-user">Notification Type</Label>
                  <Select 
                    value={notificationType} 
                    onValueChange={setNotificationType}
                  >
                    <SelectTrigger id="type-user">
                      <SelectValue placeholder="Select notification type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TEST">Test</SelectItem>
                      <SelectItem value="APPOINTMENT">Appointment</SelectItem>
                      <SelectItem value="PAYMENT">Payment</SelectItem>
                      <SelectItem value="SYSTEM">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={sendUserNotification} 
                  disabled={loading || !targetUser}
                  className="w-full"
                >
                  {loading ? "Sending..." : "Send Test Notification to User"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
        
        {result && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Result</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-3 rounded-md overflow-auto max-h-[300px]">
                <pre className="text-xs">{JSON.stringify(result, null, 2)}</pre>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
} 