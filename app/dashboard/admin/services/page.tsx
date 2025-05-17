"use client";

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
import { Textarea } from "@/components/ui/textarea";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  BarChart,
  Check,
  Clock,
  DollarSign,
  Edit,
  MoreHorizontal,
  Plus,
  Search,
  Trash,
  X,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { getServices, createService } from "@/app/actions/services";
import UpdateService from "@/app/actions/update-service";
import DeleteService from "@/app/actions/delete-service";

// Service categories
const categories = [
  "All Categories",
  "exterior",
  "interior",
  "combo",
  "premium",
  "specialty",
];

export default function AdminServices() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedService, setSelectedService] = useState<any | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState("All Categories");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [newService, setNewService] = useState({
    name: "",
    description: "",
    price: "",
    duration: "",
    features: [""],
  });
  const [editService, setEditService] = useState({
    name: "",
    description: "",
    price: "",
    duration: "",
    features: [""],
  });

  // Fetch services on component mount
  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const fetchedServices = await getServices();
      setServices(fetchedServices);
    } catch (error) {
      console.error("Error fetching services:", error);
      toast.error("Failed to fetch services");
    }
  };

  // Filter services based on search query and filters
  const filteredServices = services.filter((service) => {
    // Search query filter
    const matchesSearch =
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.id.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  // Sort services by price (highest first)
  const sortedServices = [...filteredServices].sort(
    (a, b) => parseFloat(b.price) - parseFloat(a.price)
  );

  const handleViewDetails = (service: any) => {
    setSelectedService(service);
  };

  const handleEditService = (service: any) => {
   
    setSelectedService(service);
    setEditService({
      name: service.name,
      description: service.description || "",
      price: service.price,
      duration: service.duration.replace(" min", ""), // Extract just the number from "45 min"
      features: Array.isArray(service.features) ? service.features : [""],
    });
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

  const getPopularityBadge = (popularity: string) => {
    switch (popularity) {
      case "high":
        return <Badge className="bg-green-500">High</Badge>;
      case "medium":
        return <Badge className="bg-blue-500">Medium</Badge>;
      case "low":
        return <Badge className="bg-yellow-500">Low</Badge>;
      default:
        return <Badge variant="outline">{popularity}</Badge>;
    }
  };

  const clearFilters = () => {
    setFilterCategory("All Categories");
    setFilterStatus("all");
    setSearchQuery("");
  };

  const handleAddFeature = () => {
    setNewService((prev) => ({
      ...prev,
      features: [...prev.features, ""],
    }));
  };

  const handleRemoveFeature = (index: number) => {
    setNewService((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const handleFeatureChange = (index: number, value: string) => {
    setNewService((prev) => ({
      ...prev,
      features: prev.features.map((feature, i) =>
        i === index ? value : feature
      ),
    }));
  };

  const handleSubmitNewService = async () => {
    try {
      setIsLoading(true);

      // Validate required fields
      if (!newService.name.trim()) {
        toast.error("Service name is required");
        return;
      }
      if (!newService.price.trim()) {
        toast.error("Price is required");
        return;
      }
      if (!newService.duration.trim()) {
        toast.error("Duration is required");
        return;
      }

      // Filter out empty features
      const filteredFeatures = newService.features.filter(
        (feature) => feature.trim() !== ""
      );

      await createService({
        name: newService.name,
        description: newService.description,
        price: newService.price,
        duration: newService.duration,
        features: filteredFeatures,
      });

      // Refresh services after adding a new one
      await loadServices();

      toast.success("Service created successfully");
      setIsAddDialogOpen(false);
      setNewService({
        name: "",
        description: "",
        price: "",
        duration: "",
        features: [""],
      });
    } catch (error) {
      console.error("Error in handleSubmitNewService:", error);
      toast.error("Failed to create service");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateService = async () => {
    try {
      setIsLoading(true);

      // Validate required fields
      if (!editService.name.trim()) {
        toast.error("Service name is required");
        return;
      }
      if (!editService.price) {
        toast.error("Price is required");
        return;
      }
      if (!editService.duration) {
        toast.error("Duration is required");
        return;
      }

      // Convert price and duration to numbers if they're strings
      const price =
        typeof editService.price === "string"
          ? parseFloat(editService.price)
          : editService.price;
      const duration =
        typeof editService.duration === "string"
          ? parseInt(editService.duration)
          : editService.duration;

      if (isNaN(price) || price <= 0) {
        toast.error("Please enter a valid price");
        return;
      }
      if (isNaN(duration) || duration <= 0) {
        toast.error("Please enter a valid duration");
        return;
      }

      // Filter out empty features
      const filteredFeatures = editService.features.filter(
        (feature) => feature.trim() !== ""
      );

      await UpdateService({
        id: selectedService.id,
        name: editService.name,
        description: editService.description,
        price: String(price),
        duration: duration,
        features: filteredFeatures,
      });

      // Refresh services after updating
      await loadServices();

      toast.success("Service updated successfully");
      setIsEditDialogOpen(false);
      setSelectedService(null);
    } catch (error) {
      console.error("Error in handleUpdateService:", error);
      toast.error("Failed to update service");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    try {
      setIsLoading(true);
      await DeleteService(serviceId);

      // Refresh services after deleting
      await loadServices();

      toast.success("Service deleted successfully");
      setIsEditDialogOpen(false);
      setSelectedService(null);
    } catch (error) {
      console.error("Error in handleDeleteService:", error);
      toast.error("Failed to delete service");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout userRole="admin">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Services</h1>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Service
          </Button>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>All Service</CardTitle>
              <CardDescription>Manage your service offerings</CardDescription>
            </CardHeader>

            <CardContent>
              {sortedServices.length === 0 ? (
                <div className="text-center py-8">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <DollarSign className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">
                    No services found
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    No services match your search criteria.
                  </p>
                  <Button className="mt-4" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <div>
                  {/* Desktop view - Table */}
                  <div className="hidden md:block overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Service</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedServices.map((service) => (
                          <TableRow key={service.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div>
                                  <div className="font-medium">
                                    {service.name}
                                  </div>
                                  <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                                    {service.description}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              Rs{parseFloat(service.price).toFixed(2)}
                            </TableCell>
                            <TableCell>{service.duration} min</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <div
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                  onClick={() => handleViewDetails(service)}
                                >
                                  <Eye className="h-4 w-4" />
                                  <span className="sr-only">View Details</span>
                                </div>
                                <div
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                  onClick={() => handleEditService(service)}
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

                  {/* Mobile view - Cards */}
                  <div className="grid gap-4 md:hidden">
                    {sortedServices.map((service) => (
                      <Card key={service.id} className="overflow-hidden">
                        <CardContent className="p-0">
                          <div className="flex items-center gap-3 p-4">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium">{service.name}</div>
                              <div className="text-sm text-muted-foreground truncate">
                                {service.description}
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={() => handleViewDetails(service)}
                                >
                                  View details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleEditService(service)}
                                >
                                  Edit service
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive">
                                  Delete service
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <div className="border-t px-4 py-3 grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <div className="text-muted-foreground">Price</div>
                              <div className="font-medium">
                                Rs{parseFloat(service.price).toFixed(2)}
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">
                                Duration
                              </div>
                              <div className="font-medium">
                                {service.duration} min
                              </div>
                            </div>
                          </div>
                          <div className="border-t px-4 py-3 flex justify-between">
                            <div
                              className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded-md hover:bg-accent cursor-pointer"
                              onClick={() => handleViewDetails(service)}
                            >
                              <Eye className="h-4 w-4" /> Details
                            </div>
                            <div
                              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 cursor-pointer"
                              onClick={() => handleEditService(service)}
                            >
                              <Edit className="h-4 w-4" /> Edit
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Service Details Dialog */}
        {selectedService && !isEditDialogOpen && (
          <Dialog
            open={!!selectedService && !isEditDialogOpen}
            onOpenChange={() => setSelectedService(null)}
          >
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-auto">
              <DialogHeader>
                <DialogTitle>Service Details</DialogTitle>
                <DialogDescription>
                  Service #{selectedService.id}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div>
                    <h2 className="text-xl font-semibold">
                      {selectedService.name}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusBadge(selectedService.status)}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-sm">{selectedService.description}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Price</h3>
                    <div className="flex items-center gap-2 text-lg">
                      <DollarSign className="h-5 w-5 text-muted-foreground" />
                      <span>
                        {parseFloat(selectedService.price).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Duration</h3>
                    <div className="flex items-center gap-2 text-lg">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <span>{selectedService.duration} minutes</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Features</h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedService.features &&
                    selectedService.features.length > 0 ? (
                      selectedService.features.map(
                        (feature: string, index: number) => (
                          <li
                            key={index}
                            className="flex items-center gap-2 text-sm"
                          >
                            <Check className="h-4 w-4 text-primary flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        )
                      )
                    ) : (
                      <li className="text-sm text-muted-foreground">
                        No features added yet
                      </li>
                    )}
                  </ul>
                </div>
              </div>
              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleEditService(selectedService)}
                  className="w-full sm:w-auto"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Service
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Edit Service Dialog */}
        {selectedService && isEditDialogOpen && (
          <Dialog
            open={isEditDialogOpen}
            onOpenChange={(open) => {
              setIsEditDialogOpen(open);
              if (!open) {
                setSelectedService(null);
              }
            }}
          >
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-auto">
              <DialogHeader>
                <DialogTitle>Edit Service</DialogTitle>
                <DialogDescription>
                  Update service #{selectedService.id} details
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Service Name</Label>
                  <Input
                    id="edit-name"
                    value={editService.name}
                    onChange={(e) =>
                      setEditService((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editService.description}
                    onChange={(e) =>
                      setEditService((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-price">Price (Rs)</Label>
                    <Input
                      id="edit-price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={editService.price}
                      onChange={(e) =>
                        setEditService((prev) => ({
                          ...prev,
                          price: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="edit-duration">Duration (minutes)</Label>
                    <Input
                      id="edit-duration"
                      type="number"
                      min="0"
                      value={editService.duration}
                      onChange={(e) =>
                        setEditService((prev) => ({
                          ...prev,
                          duration: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Features</Label>
                  <div className="border rounded-md p-3 space-y-2">
                    {editService.features && editService.features.length > 0 ? (
                      editService.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            value={feature}
                            onChange={(e) =>
                              setEditService((prev) => ({
                                ...prev,
                                features: prev.features.map((f, i) =>
                                  i === index ? e.target.value : f
                                ),
                              }))
                            }
                            className="flex-1"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 flex-shrink-0"
                            onClick={() =>
                              setEditService((prev) => ({
                                ...prev,
                                features: prev.features.filter(
                                  (_, i) => i !== index
                                ),
                              }))
                            }
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        No features added yet
                      </div>
                    )}
                    <Button
                      className="w-full mt-2"
                      onClick={() =>
                        setEditService((prev) => ({
                          ...prev,
                          features: [...(prev.features || []), ""],
                        }))
                      }
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Feature
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  className="w-full sm:w-auto"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteService(selectedService.id)}
                  className="w-full sm:w-auto"
                  disabled={isLoading}
                >
                  Delete Service
                </Button>
                <Button
                  className="w-full sm:w-auto"
                  onClick={handleUpdateService}
                  disabled={isLoading}
                >
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Add Service Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Add New Service</DialogTitle>
              <DialogDescription>
                Enter the details for the new service
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="new-name">Service Name</Label>
                <Input
                  id="new-name"
                  placeholder="Premium Wash"
                  value={newService.name}
                  onChange={(e) =>
                    setNewService((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="new-description">Description</Label>
                <Textarea
                  id="new-description"
                  placeholder="Describe what this service includes and its benefits"
                  value={newService.description}
                  onChange={(e) =>
                    setNewService((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="new-price">Price (Rs)</Label>
                  <Input
                    id="new-price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="49.99"
                    value={newService.price}
                    onChange={(e) =>
                      setNewService((prev) => ({
                        ...prev,
                        price: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="new-duration">Duration (minutes)</Label>
                  <Input
                    id="new-duration"
                    type="number"
                    placeholder="45"
                    value={newService.duration}
                    onChange={(e) =>
                      setNewService((prev) => ({
                        ...prev,
                        duration: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Features</Label>
                <div className="border rounded-md p-3 space-y-2">
                  {newService.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        placeholder="Enter feature"
                        className="flex-1"
                        value={feature}
                        onChange={(e) =>
                          handleFeatureChange(index, e.target.value)
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 flex-shrink-0"
                        onClick={() => handleRemoveFeature(index)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button className="w-full mt-2" onClick={handleAddFeature}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Feature
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
                className="w-full sm:w-auto"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                className="w-full sm:w-auto"
                onClick={handleSubmitNewService}
                disabled={isLoading}
              >
                {isLoading ? "Adding..." : "Add Service"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
