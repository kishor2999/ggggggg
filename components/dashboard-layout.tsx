"use client";

import type React from "react";

import { CartIcon } from "@/components/cart-icon";
import { NotificationMenu } from "@/components/notification-menu";
import { useSafeNavigation } from "@/components/safe-navigation-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  SignedIn,
  UserButton,
  useUser
} from "@clerk/nextjs";
import {
  Calendar,
  Car,
  CreditCard,
  Home,
  LogOut,
  Menu,
  ShoppingBag,
  User,
  Users,
  Wrench,
  X
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  userRole: "admin" | "user" | "employee";
}

export function DashboardLayout({ children, userRole }: DashboardLayoutProps) {
  // Start with a more robust mounting check
  const [isMounted, setIsMounted] = useState(false);
  const { user } = useUser();
  
  // Use our safe navigation context instead of usePathname/useRouter
  const { pathname: safePathname, navigate } = useSafeNavigation();
  
  useEffect(() => {
    // Set mounted state
    setIsMounted(true);
  }, []);

  // Don't render nav elements during SSR
  if (!isMounted) {
    return <div className="flex min-h-screen flex-col">{children}</div>;
  }

  const adminNavItems: NavItem[] = [
    { title: "Dashboard", href: "/dashboard/admin", icon: Home },
    { title: "Bookings", href: "/dashboard/admin/bookings", icon: Calendar },
    { title: "Orders", href: "/dashboard/admin/orders", icon: CreditCard },
    { title: "Users", href: "/dashboard/admin/users", icon: Users },
    { title: "Services", href: "/dashboard/admin/services", icon: Car },
    { title: "Products", href: "/dashboard/admin/products", icon: ShoppingBag },
  ];

  const userNavItems: NavItem[] = [
    { title: "Dashboard", href: "/dashboard/user", icon: Home },
    { title: "Book Service", href: "/dashboard/user/book", icon: Calendar },
    { title: "My Bookings", href: "/dashboard/user/bookings", icon: Car },
    { title: "Products", href: "/dashboard/user/products", icon: ShoppingBag },
    { title: "My Orders", href: "/dashboard/user/orders", icon: CreditCard },
    { title: "Payments", href: "/dashboard/user/payments", icon: CreditCard },
  ];

  const employeeNavItems: NavItem[] = [
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

  const handleRoleChange = (value: string) => {
    // Safe navigation
    try {
      if (value === "admin") {
        window.location.href = "/dashboard/admin";
      } else if (value === "user") {
        window.location.href = "/dashboard/user";
      } else if (value === "employee") {
        window.location.href = "/dashboard/employee";
      }
    } catch (error) {
      console.error("Navigation error:", error);
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
                    safePathname === item.href
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
          <NotificationMenu />
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
                  safePathname === item.href
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
