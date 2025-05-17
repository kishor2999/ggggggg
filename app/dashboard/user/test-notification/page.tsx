"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";

export default function TestNotifications() {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  const testNotifications = async () => {
    if (!user?.id) {
      toast.error("User not found");
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/debug-notifications?userId=${user.id}`);
      const data = await response.json();
      
      setTestResults(data);
      toast.success("Test notification sent");
          } catch (error) {
      console.error("Error sending test notification:", error);
      toast.error("Failed to send test notification");
      setTestResults({ error });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout userRole="user">
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Test Notifications</h1>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Notification Debugging</CardTitle>
            <CardDescription>
              Use this page to test if notifications are working correctly
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded">
              <p className="text-sm mb-2 font-medium">User Information:</p>
              <p className="text-sm">User ID: {user?.id || "Not logged in"}</p>
              <p className="text-sm">Name: {user?.fullName || "Unknown"}</p>
            </div>
            
            <Button 
              onClick={testNotifications} 
              disabled={isLoading || !user?.id}
            >
              {isLoading ? "Sending..." : "Send Test Notification"}
            </Button>
            
            {testResults && (
              <div className="mt-4">
                <h3 className="font-medium mb-2">Test Results:</h3>
                <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                  {JSON.stringify(testResults, null, 2)}
                </pre>
              </div>
            )}

            <div className="bg-amber-50 p-4 rounded border border-amber-200">
              <h3 className="font-medium text-amber-800 mb-2">Debugging Tips:</h3>
              <ul className="list-disc list-inside text-sm space-y-1 text-amber-700">
                <li>Check browser console for Pusher connection logs</li>
                <li>Verify that the user ID is correct</li>
                <li>Confirm the notification payload includes all required fields</li>
                <li>Make sure Pusher channels are subscribed correctly (user-{user?.id})</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 