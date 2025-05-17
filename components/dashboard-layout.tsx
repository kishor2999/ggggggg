"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import {
  BarChart3,
  Bell,
  Calendar,
  Car,
  CreditCard,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  Star,
  User,
  Users,
  Wrench,
  X,
  ShoppingBag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { CartIcon } from "@/components/cart-icon";
import { pusherClient } from "@/lib/pusher";
import { toast } from "sonner";
import { format } from "date-fns";
import { NotificationMenu } from "@/components/notification-menu";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: Date;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  userRole: "admin" | "user" | "employee";
}

export function DashboardLayout({ children, userRole }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const { user } = useUser();

  // Fetch notifications when component mounts
  useEffect(() => {
    setIsMounted(true);

    // Only attempt to fetch notifications if we have a user
    if (user?.id) {
      fetchNotifications();
    }
  }, [user?.id]);

  // Subscribe to Pusher channels for real-time notifications
  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to user-specific channel
    const channel = pusherClient.subscribe(`user-${user.id}`);

    // Also subscribe to role-based channel
    const roleChannel = pusherClient.subscribe(`${userRole}-notifications`);

    // Handle new notifications
    const handleNewNotification = (notification: Notification) => {
      setNotifications(prev => [notification, ...prev]);
      setNotificationCount(prev => prev + 1);

      // Show toast notification
      toast.info(notification.title, {
        description: notification.message,
        duration: 5000,
      });
    };

    // Listen for new notification events on both channels
    channel.bind('new-notification', handleNewNotification);
    roleChannel.bind('new-notification', handleNewNotification);

    // Cleanup on unmount
    return () => {
      pusherClient.unsubscribe(`user-${user.id}`);
      pusherClient.unsubscribe(`${userRole}-notifications`);
    };
  }, [user?.id, userRole]);

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      const response = await fetch(`/api/notifications?userId=${user?.id}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
        setNotificationCount(data.filter((n: Notification) => !n.isRead).length);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  // Mark a notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      // Update locally first for better UX
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );
      setNotificationCount(prev => Math.max(0, prev - 1));

      // Then update on the server
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT'
      });

      if (!response.ok) {
        console.error("Failed to mark notification as read");
        // Revert the local change if server update fails
        fetchNotifications();
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
      fetchNotifications();
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user?.id || notifications.length === 0) return;

    try {
      // Update locally first for better UX
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, isRead: true }))
      );
      setNotificationCount(0);

      // Then update on the server
      const response = await fetch(`/api/notifications/mark-all-read?userId=${user.id}`, {
        method: 'PUT'
      });

      if (!response.ok) {
        console.error("Failed to mark all notifications as read");
        // Revert the local change if server update fails
        fetchNotifications();
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      fetchNotifications();
    }
  };

  if (!isMounted) {
    return null;
  }

  const adminNavItems = [
    { title: "Dashboard", href: "/dashboard/admin", icon: Home },
    { title: "Bookings", href: "/dashboard/admin/bookings", icon: Calendar },
    { title: "Orders", href: "/dashboard/admin/orders", icon: CreditCard },
    { title: "Users", href: "/dashboard/admin/users", icon: Users },
    { title: "Services", href: "/dashboard/admin/services", icon: Car },
    { title: "Products", href: "/dashboard/admin/products", icon: ShoppingBag },
  ];

  const userNavItems = [
    { title: "Dashboard", href: "/dashboard/user", icon: Home },
    { title: "Book Service", href: "/dashboard/user/book", icon: Calendar },
    { title: "My Bookings", href: "/dashboard/user/bookings", icon: Car },
    { title: "Products", href: "/dashboard/user/products", icon: ShoppingBag },
    { title: "My Orders", href: "/dashboard/user/orders", icon: CreditCard },
    { title: "Payments", href: "/dashboard/user/payments", icon: CreditCard },
    // { title: "Reviews", href: "/dashboard/user/reviews", icon: Star },
    // { title: "Profile", href: "/dashboard/user/profile", icon: User },
  ];

  const employeeNavItems = [
    { title: "Dashboard", href: "/dashboard/employee", icon: Home },
    { title: "Assigned Tasks", href: "/dashboard/employee/tasks", icon: Car },
  ];

  const navItems =
    userRole === "admin"
      ? adminNavItems
      : userRole === "user"
        ? userNavItems
        : employeeNavItems;

  const roleLabel =
    userRole === "admin"
      ? "Administrator"
      : userRole === "user"
        ? "Customer"
        : "Employee";

  const userName =
    userRole === "admin"
      ? "John Admin"
      : userRole === "user"
        ? "Sarah Customer"
        : "Mike Employee";

  const handleRoleChange = (value: string) => {
    if (value === "admin") {
      router.push("/dashboard/admin");
    } else if (value === "user") {
      router.push("/dashboard/user");
    } else if (value === "employee") {
      router.push("/dashboard/employee");
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <Sheet>
          <SheetTrigger asChild>
            <div className="flex items-center justify-center h-9 w-9 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground xl:hidden cursor-pointer">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </div>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 sm:max-w-none">
            <div className="flex h-16 items-center border-b px-6">
              <Link href="/" className="flex items-center gap-2 font-semibold">
                <Car className="h-6 w-6 text-primary" />
                <span>CleanDrives</span>
              </Link>
              <div className="ml-auto">
                <X className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
            <nav className="grid gap-2 p-4 text-lg font-medium">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-accent",
                    pathname === item.href
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.title}
                </Link>
              ))}
              <div className="mt-4 pt-4 border-t">
                <Link
                  href="/"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-accent"
                >
                  <LogOut className="h-5 w-5" />
                  Back to Dashboard Selection
                </Link>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Car className="h-6 w-6 text-primary" />
          <span className="hidden xl:inline-block">CleanDrives</span>
        </Link>
        <div className="ml-auto flex items-center gap-4">
          {userRole === "user" && <CartIcon />}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="hidden md:flex">
                {userRole === "admin" ? (
                  <Users className="mr-2 h-4 w-4" />
                ) : userRole === "user" ? (
                  <User className="mr-2 h-4 w-4" />
                ) : (
                  <Wrench className="mr-2 h-4 w-4" />
                )}
                {roleLabel} View
                <span className="sr-only">Change dashboard view</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Switch Dashboard</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup
                value={userRole}
                onValueChange={handleRoleChange}
              >
                <DropdownMenuRadioItem value="admin">
                  <Users className="mr-2 h-4 w-4" />
                  <span>Admin Dashboard</span>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="user">
                  <User className="mr-2 h-4 w-4" />
                  <span>User Dashboard</span>
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="employee">
                  <Wrench className="mr-2 h-4 w-4" />
                  <span>Employee Dashboard</span>
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Back to Selection</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <NotificationMenu
            notifications={notifications}
            notificationCount={notificationCount}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
          />
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </header>
      <div className="grid flex-1 xl:grid-cols-[220px_1fr]">
        <aside className="hidden border-r bg-muted/40 xl:block">
          <nav className="grid gap-2 p-4 text-sm font-medium">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-accent",
                  pathname === item.href
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.title}
              </Link>
            ))}
            <div className="mt-4 pt-4 border-t">
              <Link
                href="/"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:bg-accent"
              >
                <LogOut className="h-5 w-5" />
                Back to Selection
              </Link>
            </div>
          </nav>
        </aside>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
