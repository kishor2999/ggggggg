"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  Calendar,
  Edit,
  Phone,
  Plus,
  Search,
  Star,
  User,
  X,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import { getStaff, type StaffWithUser } from "@/app/actions/staff";

// Sample locations
const locations = [
  "All Locations",
  "Downtown Branch",
  "Westside Branch",
  "Eastside Branch",
  "Northside Branch",
];

// Sample roles
const roles = ["All Roles", "Washer", "Detailer", "Manager", "Receptionist"];

export default function AdminEmployees() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmployee, setSelectedEmployee] =
    useState<StaffWithUser | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [filterLocation, setFilterLocation] = useState("All Locations");
  const [filterRole, setFilterRole] = useState("All Roles");
  const [filterRating, setFilterRating] = useState("All Ratings");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [staff, setStaff] = useState<StaffWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const staffData = await getStaff();
        setStaff(staffData);
      } catch (error) {
        console.error("Error fetching staff:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStaff();
  }, []);

  // Filter staff based on search query and filters
  const filteredStaff = staff.filter((employee) => {
    // Search query filter
    const matchesSearch =
      employee.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (employee.user.phone && employee.user.phone.includes(searchQuery)) ||
      employee.id.toLowerCase().includes(searchQuery.toLowerCase());

    // Role filter
    const matchesRole =
      filterRole === "All Roles" || employee.role === filterRole;

    return matchesSearch && matchesRole;
  });

  // Sort staff by creation date (most recent first)
  const sortedStaff = [...filteredStaff].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  const handleViewDetails = (employee: StaffWithUser) => {
    setSelectedEmployee(employee);
  };

  const handleEditEmployee = (employee: StaffWithUser) => {
    setSelectedEmployee(employee);
    setIsEditDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500">Active</Badge>;
      case "inactive":
        return <Badge variant="outline">Inactive</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const clearFilters = () => {
    setFilterRole("All Roles");
    setFilterRating("All Ratings");
    setSearchQuery("");
  };

  // Automatically switch to card view on smaller screens
  const handleResize = () => {
    if (typeof window !== "undefined") {
      setViewMode(window.innerWidth < 768 ? "cards" : "table");
    }
  };

  // Set initial view mode based on screen size
  if (typeof window !== "undefined") {
    window.addEventListener("resize", handleResize);
    // Set initial view mode
    if (viewMode === "table" && window.innerWidth < 768) {
      setViewMode("cards");
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout userRole="admin">
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole="admin">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Employee
          </Button>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Filters</CardTitle>
              <CardDescription>
                Filter employees by various criteria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="relative w-full">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search by name, email, or phone..."
                    className="pl-8 w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-9 w-9"
                      onClick={() => setSearchQuery("")}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Clear search</span>
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={filterRole} onValueChange={setFilterRole}>
                      <SelectTrigger id="role">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button variant="ghost" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>All Employees</CardTitle>
                <CardDescription>Manage your employee database</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === "table" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                  className="hidden md:flex"
                >
                  Table View
                </Button>
                <Button
                  variant={viewMode === "cards" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("cards")}
                >
                  Card View
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {sortedStaff.length === 0 ? (
                <div className="text-center py-8">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <User className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">
                    No employees found
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    No employees match your search criteria.
                  </p>
                  <Button className="mt-4" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </div>
              ) : viewMode === "table" ? (
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead className="hidden md:table-cell">
                          Role
                        </TableHead>
                        <TableHead className="hidden xl:table-cell">
                          Email
                        </TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedStaff.map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarImage
                                  src={
                                    employee.user.profileImage ||
                                    `/placeholder.svg?height=36&width=36`
                                  }
                                  alt={employee.user.name}
                                />
                                <AvatarFallback>
                                  {employee.user.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">
                                  {employee.user.name}
                                </div>
                                <div className="text-sm text-muted-foreground hidden sm:block">
                                  {employee.user.email}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {employee.role}
                          </TableCell>
                          <TableCell className="hidden xl:table-cell">
                            {employee.user.email}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <div
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                onClick={() => handleViewDetails(employee)}
                              >
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">View Details</span>
                              </div>
                              <div
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                onClick={() => handleEditEmployee(employee)}
                              >
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {sortedStaff.map((employee) => (
                    <Card key={employee.id} className="overflow-hidden">
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={
                                employee.user.profileImage ||
                                `/placeholder.svg?height=40&width=40`
                              }
                              alt={employee.user.name}
                            />
                            <AvatarFallback>
                              {employee.user.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-base">
                              {employee.user.name}
                            </CardTitle>
                            <CardDescription className="text-xs">
                              {employee.user.email}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                          <div>
                            <span className="text-muted-foreground">Role:</span>
                            <p className="font-medium">{employee.role}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Phone:
                            </span>
                            <p className="font-medium">
                              {employee.user.phone || "N/A"}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleViewDetails(employee)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleEditEmployee(employee)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Employee Details Dialog */}
        {selectedEmployee && !isEditDialogOpen && (
          <Dialog
            open={!!selectedEmployee && !isEditDialogOpen}
            onOpenChange={() => setSelectedEmployee(null)}
          >
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-auto">
              <DialogHeader>
                <DialogTitle>Employee Details</DialogTitle>
                <DialogDescription>
                  Employee #{selectedEmployee.id}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage
                      src={
                        selectedEmployee.user.profileImage ||
                        `/placeholder.svg?height=64&width=64`
                      }
                      alt={selectedEmployee.user.name}
                    />
                    <AvatarFallback>
                      {selectedEmployee.user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-xl font-semibold">
                      {selectedEmployee.user.name}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{selectedEmployee.role}</Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Contact Information</h3>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedEmployee.user.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedEmployee.user.phone || "N/A"}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Employment Details</h3>
                    <div className="space-y-1">
                      <div className="text-sm">
                        <span className="font-medium">Role:</span>{" "}
                        {selectedEmployee.role}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Join Date:</span>{" "}
                        {format(selectedEmployee.createdAt, "MMMM d, yyyy")}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleEditEmployee(selectedEmployee)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Employee
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Edit Employee Dialog */}
        {selectedEmployee && isEditDialogOpen && (
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-auto">
              <DialogHeader>
                <DialogTitle>Edit Employee</DialogTitle>
                <DialogDescription>
                  Update employee #{selectedEmployee.id} details
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="details">Personal Details</TabsTrigger>
                    <TabsTrigger value="employment">Employment</TabsTrigger>
                    <TabsTrigger value="skills">Skills & Notes</TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="space-y-4 mt-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-name">Full Name</Label>
                      <Input
                        id="edit-name"
                        defaultValue={selectedEmployee.user.name}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="edit-email">Email</Label>
                        <Input
                          id="edit-email"
                          type="email"
                          defaultValue={selectedEmployee.user.email}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="edit-phone">Phone</Label>
                        <Input
                          id="edit-phone"
                          defaultValue={selectedEmployee.user.phone}
                        />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="edit-status">Status</Label>
                      <Select defaultValue={selectedEmployee.status}>
                        <SelectTrigger id="edit-status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TabsContent>

                  <TabsContent value="employment" className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="edit-role">Role</Label>
                        <Select defaultValue={selectedEmployee.role}>
                          <SelectTrigger id="edit-role">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Washer">Washer</SelectItem>
                            <SelectItem value="Detailer">Detailer</SelectItem>
                            <SelectItem value="Manager">Manager</SelectItem>
                            <SelectItem value="Receptionist">
                              Receptionist
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="edit-location">Location</Label>
                        <Select defaultValue={selectedEmployee.location}>
                          <SelectTrigger id="edit-location">
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                          <SelectContent>
                            {locations
                              .filter((loc) => loc !== "All Locations")
                              .map((location) => (
                                <SelectItem key={location} value={location}>
                                  {location}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="edit-schedule">Schedule</Label>
                        <Select defaultValue={selectedEmployee.schedule}>
                          <SelectTrigger id="edit-schedule">
                            <SelectValue placeholder="Select schedule" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Full-time">Full-time</SelectItem>
                            <SelectItem value="Part-time">Part-time</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="edit-hire-date">Hire Date</Label>
                        <Input
                          id="edit-hire-date"
                          type="date"
                          defaultValue={format(
                            selectedEmployee.createdAt,
                            "yyyy-MM-dd"
                          )}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="skills" className="space-y-4 mt-4">
                    <div className="grid gap-2">
                      <Label htmlFor="edit-skills">Skills</Label>
                      <div className="border rounded-md p-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {[
                            "Basic Wash",
                            "Premium Wash",
                            "Deluxe Wash",
                            "Interior Clean",
                            "Full Detail",
                            "Customer Service",
                            "Management",
                          ].map((skill) => (
                            <div
                              key={skill}
                              className="flex items-center gap-2"
                            >
                              <input
                                type="checkbox"
                                id={`skill-Rs{skill}`}
                                defaultChecked={selectedEmployee.skills.includes(
                                  skill
                                )}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                              />
                              <Label htmlFor={`skill-Rs{skill}`}>{skill}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="edit-notes">Notes</Label>
                      <Input
                        id="edit-notes"
                        defaultValue={selectedEmployee.notes}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button>Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Add Employee Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
              <DialogDescription>
                Enter the details for the new employee
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="new-name">Full Name</Label>
                <Input id="new-name" placeholder="John Smith" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="new-email">Email</Label>
                  <Input
                    id="new-email"
                    type="email"
                    placeholder="john.smith@example.com"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="new-phone">Phone</Label>
                  <Input id="new-phone" placeholder="555-123-4567" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="new-role">Role</Label>
                  <Select defaultValue="Washer">
                    <SelectTrigger id="new-role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Washer">Washer</SelectItem>
                      <SelectItem value="Detailer">Detailer</SelectItem>
                      <SelectItem value="Manager">Manager</SelectItem>
                      <SelectItem value="Receptionist">Receptionist</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="new-location">Location</Label>
                  <Select defaultValue="Downtown Branch">
                    <SelectTrigger id="new-location">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations
                        .filter((loc) => loc !== "All Locations")
                        .map((location) => (
                          <SelectItem key={location} value={location}>
                            {location}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="new-schedule">Schedule</Label>
                  <Select defaultValue="Full-time">
                    <SelectTrigger id="new-schedule">
                      <SelectValue placeholder="Select schedule" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Full-time">Full-time</SelectItem>
                      <SelectItem value="Part-time">Part-time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="new-hire-date">Hire Date</Label>
                  <Input
                    id="new-hire-date"
                    type="date"
                    defaultValue={format(new Date(), "yyyy-MM-dd")}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="new-notes">Notes</Label>
                <Input
                  id="new-notes"
                  placeholder="Any special notes about this employee"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button>Add Employee</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

// Mail icon component
function Mail(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}
