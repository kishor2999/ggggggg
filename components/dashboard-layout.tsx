"use client";

import type React from "react";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import {
  BarChart3,
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

interface DashboardLayoutProps {
  children: React.ReactNode;
  userRole: "admin" | "user" | "employee";
}

export function DashboardLayout({ children, userRole }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [notifications, setNotifications] = useState(3);

  // Prevent hydration errors
  useEffect(() => {
    setIsMounted(true);
  }, []);

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
    {
      title: "My Schedule",
      href: "/dashboard/employee/schedule",
      icon: Calendar,
    },
    { title: "Assigned Tasks", href: "/dashboard/employee/tasks", icon: Car },
    {
      title: "Performance",
      href: "/dashboard/employee/performance",
      icon: BarChart3,
    },
    {
      title: "Feedback",
      href: "/dashboard/employee/feedback",
      icon: MessageSquare,
    },
    { title: "Profile", href: "/dashboard/employee/profile", icon: User },
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
                <span>CleanDrive</span>
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
          <span className="hidden xl:inline-block">CleanDrive</span>
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
          <Button variant="outline" size="icon" className="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
            {notifications > 0 && (
              <Badge
                variant="destructive"
                className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs"
              >
                {notifications}
              </Badge>
            )}
            <span className="sr-only">Toggle notifications</span>
          </Button>
          {/* <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {/* <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder-user.jpg" alt={userName} />
                  <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
                </Avatar>
              </Button> */}
          {/* </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{userName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {roleLabel}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Back to Selection</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu> */}

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
