"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { pusherClient, getUserChannel, getAdminChannel, EVENT_TYPES } from "@/lib/pusher";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function DebugPusher() {
  const { user } = useUser();
  const [title, setTitle] = useState("Test Message");
  const [message, setMessage] = useState("This is a test message from Pusher");
  const [loading, setLoading] = useState(false);
  const [channel, setChannel] = useState("");
  const [event, setEvent] = useState(EVENT_TYPES.NEW_NOTIFICATION);
  const [channelType, setChannelType] = useState("user");
  const [receivedMessages, setReceivedMessages] = useState<any[]>([]);
  const [listenChannel, setListenChannel] = useState("");
  const [isListening, setIsListening] = useState(false);

  // Effect to create and manage Pusher subscription
  useEffect(() => {
    if (!listenChannel || !isListening) return;

    // Subscribe to the specified channel
    try {
            const channel = pusherClient.subscribe(listenChannel);

      // Bind to all events - we want to see everything for debugging
      const handleEvent = (eventName: string, data: any) => {
                setReceivedMessages(prev => [
          {
            timestamp: new Date().toISOString(),
            channel: listenChannel,
            event: eventName,
            data
          },
          ...prev
        ]);

        toast.info(`Event received: ${eventName}`, {
          description: `Channel: ${listenChannel}`,
        });
      };

      // Bind to specific events we know about
      for (const eventType of Object.values(EVENT_TYPES)) {
        channel.bind(eventType, (data: any) => handleEvent(eventType, data));
      }

      // Also bind to a generic event handler to catch any other events
      channel.bind_global((eventName: string, data: any) => {
        // Only handle events that aren't already handled
        if (!Object.values(EVENT_TYPES).includes(eventName)) {
          handleEvent(eventName, data);
        }
      });

      // Cleanup function
      return () => {
                channel.unbind_all();
        pusherClient.unsubscribe(listenChannel);
      };
    } catch (error) {
      console.error("Error setting up Pusher subscription:", error);
      toast.error("Failed to subscribe to Pusher channel");
      setIsListening(false);
    }
  }, [listenChannel, isListening]);

  const sendPusherMessage = async () => {
    if (!channel || !event) {
      toast.error("Channel and event type are required");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/test-pusher", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channel,
          event,
          data: {
            title,
            message,
            timestamp: new Date().toISOString(),
            id: Date.now().toString(),
            isRead: false,
            type: "DEBUG"
          }
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success("Message sent successfully!", {
          description: `Channel: ${channel}, Event: ${event}`,
        });
              } else {
        toast.error("Failed to send message");
        console.error("Error:", data);
      }
    } catch (error) {
      console.error("Error sending Pusher message:", error);
      toast.error("An error occurred while sending the message");
    } finally {
      setLoading(false);
    }
  };

  const startListening = () => {
    if (!listenChannel) {
      toast.error("Please enter a channel to listen to");
      return;
    }
    
    setIsListening(true);
    toast.success(`Started listening to channel: ${listenChannel}`);
  };

  const stopListening = () => {
    setIsListening(false);
    toast.info(`Stopped listening to channel: ${listenChannel}`);
  };

  const clearMessages = () => {
    setReceivedMessages([]);
    toast.info("Cleared message history");
  };

  const updateChannelFromType = (type: string) => {
    setChannelType(type);
    
    if (type === "user" && user) {
      setChannel(getUserChannel(user.id));
    } else if (type === "admin") {
      setChannel(getAdminChannel());
    } else if (type === "custom") {
      setChannel("");
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Pusher Debugging Tools</h1>
      
      <Tabs defaultValue="send">
        <TabsList className="mb-4">
          <TabsTrigger value="send">Send Messages</TabsTrigger>
          <TabsTrigger value="listen">Listen for Events</TabsTrigger>
        </TabsList>
        
        <TabsContent value="send">
          <Card>
            <CardHeader>
              <CardTitle>Send Pusher Message</CardTitle>
              <CardDescription>
                Send a test message to any Pusher channel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="channelType">Channel Type</Label>
                  <Select 
                    value={channelType} 
                    onValueChange={updateChannelFromType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select channel type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Current User Channel</SelectItem>
                      <SelectItem value="admin">Admin Channel</SelectItem>
                      <SelectItem value="custom">Custom Channel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="event">Event Type</Label>
                  <Select 
                    value={event} 
                    onValueChange={setEvent}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(EVENT_TYPES).map(([key, value]) => (
                        <SelectItem key={key} value={value}>
                          {key} ({value})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="channel">Channel Name</Label>
                <Input
                  id="channel"
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  placeholder="Enter channel name"
                  disabled={channelType !== "custom"}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="title">Message Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter message title"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message">Message Body</Label>
                <Input
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter message body"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={sendPusherMessage} 
                disabled={loading || !channel || !event}
                className="w-full"
              >
                {loading ? "Sending..." : "Send Pusher Message"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="listen">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Listen for Pusher Events</CardTitle>
                <CardDescription>
                  Subscribe to a channel and monitor events
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="listenChannel">Channel to Listen</Label>
                    <Input
                      id="listenChannel"
                      value={listenChannel}
                      onChange={(e) => setListenChannel(e.target.value)}
                      placeholder="Enter channel name to listen to"
                      disabled={isListening}
                    />
                  </div>
                  
                  <div className="pt-8">
                    {isListening ? (
                      <Button 
                        onClick={stopListening} 
                        variant="destructive"
                      >
                        Stop Listening
                      </Button>
                    ) : (
                      <Button 
                        onClick={startListening} 
                        disabled={!listenChannel}
                      >
                        Start Listening
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Event Log</CardTitle>
                <Button 
                  onClick={clearMessages} 
                  variant="outline" 
                  size="sm" 
                  disabled={receivedMessages.length === 0}
                >
                  Clear Log
                </Button>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-2 rounded-md h-[300px] overflow-y-auto">
                  {receivedMessages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-12">
                      No events received yet. Start listening to a channel to see events.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {receivedMessages.map((msg, index) => (
                        <div key={index} className="bg-card p-3 rounded border text-sm">
                          <div className="flex justify-between mb-1">
                            <span className="font-medium">{msg.event}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(msg.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mb-1">
                            Channel: {msg.channel}
                          </div>
                          <pre className="text-xs bg-muted-foreground/10 p-2 rounded mt-1 overflow-x-auto">
                            {JSON.stringify(msg.data, null, 2)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 