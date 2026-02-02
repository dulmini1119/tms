"use client";
import React, { useMemo, useState } from "react";
import {
  Bell,
  Send,
  MessageSquare,
  Users,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  User,
  Link,
  Archive,
} from "lucide-react";
import { mockSystemData } from "@/data/mock-system-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

// Mock toast function (replace with react-toastify or similar)
const toast = (message: string, type: "success" | "error" = "success") => {
  console.log(`[${type.toUpperCase()}] ${message}`);
  // Implement toast notification (e.g., react-toastify)
};

// Notification interface
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "Info" | "Success" | "Warning" | "Error" | "Alert";
  category:
    | "Trip"
    | "Vehicle"
    | "Driver"
    | "Document"
    | "System"
    | "Finance"
    | "Emergency"
    | "Maintenance";
  severity: "Low" | "Medium" | "High" | "Critical";
  priority: "Normal" | "High" | "Urgent";
  status: "Unread" | "Read" | "Acknowledged" | "Resolved" | "Dismissed";
  recipientType: "User" | "Role" | "Department" | "Broadcast";
  recipients: {
    userId?: string;
    userName?: string;
    roleId?: string;
    roleName?: string;
    departmentId?: string;
    departmentName?: string;
  }[];
  sender: {
    userId?: string;
    userName?: string;
    system: boolean;
  };
  relatedEntity?: {
    type: "Trip" | "Vehicle" | "Driver" | "Document" | "User";
    id: string;
    name: string;
  };
  actionable: boolean;
  actions?: {
    id: string;
    label: string;
    action: string;
    parameters?: Record<string, unknown>;
  }[];
  scheduledFor?: string;
  expiresAt?: string;
  tags: string[];
  readBy: {
    userId: string;
    userName: string;
    readAt: string;
  }[];
  acknowledgedBy?: {
    userId: string;
    userName: string;
    acknowledgedAt: string;
    comments?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Form data interface for compose/edit dialog
interface FormData {
  type: Notification["type"] | "";
  category: Notification["category"] | "";
  title: string;
  message: string;
  priority: Notification["priority"] | "";
  severity: Notification["severity"] | "";
  recipientType: Notification["recipientType"] | "";
  recipientDetails: string;
  actionable: boolean;
  scheduledFor?: string;
}

// Form errors interface
interface FormErrors {
  type?: string;
  category?: string;
  title?: string;
  message?: string;
  priority?: string;
  severity?: string;
  recipientType?: string;
  recipientDetails?: string;
}

type NotificationAction = {
  id: string;
  label: string;
  action: string;
  parameters?: Record<string, unknown>;
};

export default function Notifications() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isComposeDialogOpen, setIsComposeDialogOpen] = useState(false);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const [selectedAction, setSelectedAction] =
    useState<NotificationAction | null>(null);
  const [notifications, setNotifications] = useState(
    mockSystemData.notifications
  );
  const [formData, setFormData] = useState<FormData>({
    type: "",
    category: "",
    title: "",
    message: "",
    priority: "",
    severity: "",
    recipientType: "",
    recipientDetails: "",
    actionable: false,
    scheduledFor: "",
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Mock current user ID (replace with actual auth context)
  const currentUserId = "current-user-id"; // TODO: Replace with actual user ID from auth

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      return (
        (notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          notification.message
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          notification.sender.userName
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase())) &&
        (statusFilter === "all" ||
          notification.status.toLowerCase() === statusFilter) &&
        (typeFilter === "all" ||
          notification.type.toLowerCase() === typeFilter) &&
        (categoryFilter === "all" ||
          notification.category.toLowerCase() === categoryFilter)
      );
    });
  }, [notifications, searchTerm, statusFilter, typeFilter, categoryFilter]);

  // Calculate stats
  const stats = useMemo(
    () => ({
      totalNotifications: notifications.length,
      unreadCount: notifications.filter((n) => n.status === "Unread").length,
      criticalCount: notifications.filter((n) => n.severity === "Critical")
        .length,
      emergencyCount: notifications.filter((n) => n.category === "Emergency")
        .length,
      acknowledgedCount: notifications.filter(
        (n) => n.status === "Acknowledged"
      ).length,
      actionableCount: notifications.filter((n) => n.actionable).length,
    }),
    [notifications]
  );

  // Form validation
  const validateForm = (): FormErrors => {
    const errors: FormErrors = {};
    if (!formData.type) errors.type = "Type is required";
    if (!formData.category) errors.category = "Category is required";
    if (!formData.title.trim()) errors.title = "Title is required";
    if (!formData.message.trim()) errors.message = "Message is required";
    if (!formData.priority) errors.priority = "Priority is required";
    if (!formData.severity) errors.severity = "Severity is required";
    if (!formData.recipientType)
      errors.recipientType = "Recipient type is required";
    if (
      formData.recipientType !== "Broadcast" &&
      !formData.recipientDetails.trim()
    )
      errors.recipientDetails = "Recipient details are required";
    return errors;
  };

  // Handlers
  const handleViewDetails = (notification: Notification) => {
    setSelectedNotification(notification);
    setIsDetailsDialogOpen(true);
  };

  const handleComposeNotification = () => {
    setSelectedNotification(null);
    setFormData({
      type: "",
      category: "",
      title: "",
      message: "",
      priority: "",
      severity: "",
      recipientType: "",
      recipientDetails: "",
      actionable: false,
      scheduledFor: "",
    });
    setFormErrors({});
    setIsComposeDialogOpen(true);
  };

  const handleEditNotification = (notification: Notification) => {
    setSelectedNotification(notification);
    setFormData({
      type: notification.type,
      category: notification.category,
      title: notification.title,
      message: notification.message,
      priority: notification.priority,
      severity: notification.severity,
      recipientType: notification.recipientType,
      recipientDetails: getRecipientSummary(notification),
      actionable: notification.actionable,
      scheduledFor: notification.scheduledFor
        ? new Date(notification.scheduledFor).toISOString().slice(0, 16)
        : "",
    });
    setFormErrors({});
    setIsComposeDialogOpen(true);
  };

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId
          ? {
              ...notification,
              status: "Read",
              readBy: [
                ...notification.readBy,
                {
                  userId: currentUserId,
                  userName: "Current User",
                  readAt: new Date().toISOString(),
                },
              ],
            }
          : notification
      )
    );
    toast("Notification marked as read", "success");
  };

  const handleArchiveNotification = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId
          ? { ...notification, status: "Dismissed" }
          : notification
      )
    );
    toast("Notification archived", "success");
  };

  const handleDeleteNotification = (notificationId: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== notificationId)
    );
    toast("Notification deleted", "success");
  };

  const handleFormChange = (field: keyof FormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (
      field !== "actionable" &&
      field !== "scheduledFor" &&
      formErrors[field as keyof FormErrors]
    ) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSaveNotification = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast("Please fix the form errors", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const newNotification: Notification = {
        id: selectedNotification?.id || crypto.randomUUID(),
        title: formData.title,
        message: formData.message,
        type: formData.type as Notification["type"],
        category: formData.category as Notification["category"],
        severity: formData.severity as Notification["severity"],
        priority: formData.priority as Notification["priority"],
        status: "Unread",
        recipientType: formData.recipientType as Notification["recipientType"],
        recipients:
          formData.recipientType === "Broadcast"
            ? []
            : [
                {
                  userName: formData.recipientDetails,
                  userId: crypto.randomUUID(),
                },
              ],
        sender: {
          userId: currentUserId,
          userName: "Current User",
          system: false,
        },
        actionable: formData.actionable,
        actions: formData.actionable
          ? [
              {
                id: crypto.randomUUID(),
                label: "Take Action",
                action: "generic_action",
                parameters: {},
              },
            ]
          : [],
        scheduledFor: formData.scheduledFor
          ? new Date(formData.scheduledFor).toISOString()
          : undefined,
        expiresAt: undefined,
        tags: [],
        readBy: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (selectedNotification) {
        // Update existing notification
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === selectedNotification.id ? newNotification : n
          )
        );
        toast("Notification updated successfully", "success");
      } else {
        // Create new notification
        setNotifications((prev) => [...prev, newNotification]);
        toast("Notification sent successfully", "success");
      }

      // TODO: Backend API call
      // await api.createOrUpdateNotification(newNotification);

      setIsComposeDialogOpen(false);
      setSelectedNotification(null);
      setFormData({
        type: "",
        category: "",
        title: "",
        message: "",
        priority: "",
        severity: "",
        recipientType: "",
        recipientDetails: "",
        actionable: false,
        scheduledFor: "",
      });
    } catch (error) {
      toast("Failed to save notification", "error");
      console.error("Error saving notification:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleActionSubmit = () => {
    if (selectedNotification && selectedAction) {
      console.log(
        `Executing action: ${selectedAction.action}`,
        selectedAction.parameters
      );
      // TODO: Backend API call to execute action
      // await api.executeAction(selectedNotification.id, selectedAction.id, parameters);
      toast(`Action "${selectedAction.label}" executed`, "success");
      setIsActionDialogOpen(false);
      setSelectedAction(null);
    }
  };

  const getStatusBadge = (status: Notification["status"]) => {
    const variants: Record<
      Notification["status"],
      {
        variant: "default" | "secondary" | "outline" | "destructive";
        icon: React.ReactNode;
      }
    > = {
      Unread: { variant: "secondary", icon: <Bell className="h-3 w-3" /> },
      Read: { variant: "outline", icon: <Eye className="h-3 w-3" /> },
      Acknowledged: {
        variant: "default",
        icon: <CheckCircle className="h-3 w-3" />,
      },
      Resolved: {
        variant: "default",
        icon: <CheckCircle className="h-3 w-3" />,
      },
      Dismissed: { variant: "outline", icon: <XCircle className="h-3 w-3" /> },
    };
    const config = variants[status] || variants["Unread"];
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {config.icon}
        {status}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRecipientSummary = (notification: Notification) => {
    if (notification.recipientType === "Broadcast") {
      return "All Users";
    }
    if (notification.recipients.length === 0) return "No recipients";
    if (notification.recipients.length === 1) {
      const recipient = notification.recipients[0];
      return (
        recipient.userName ||
        recipient.roleName ||
        recipient.departmentName ||
        "Unknown"
      );
    }
    return `${notification.recipients.length} recipients`;
  };

  const totalPages =
    pageSize > 0 ? Math.ceil(filteredNotifications.length / pageSize) : 1;
  const paginatedDocuments = filteredNotifications.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="p-3">
          <h1 className="text-2xl">NOTIFICATIONS</h1>
          <p className="text-muted-foreground text-xs">
            Manage system notifications and communications
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleComposeNotification}>
            <Send className="h-4 w-4 mr-2" />
            Send Notification
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">
                  {stats.totalNotifications}
                </div>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-yellow-500" />
              <div>
                <div className="text-2xl font-bold">{stats.unreadCount}</div>
                <p className="text-sm text-muted-foreground">Unread</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <div>
                <div className="text-2xl font-bold">{stats.emergencyCount}</div>
                <p className="text-sm text-muted-foreground">Emergency</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notification Center */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Center</CardTitle>
          <CardDescription>
            System-wide notifications and user communications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex items-center space-x-4 mb-6 flex-wrap gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
                aria-label="Search notifications"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
                <SelectItem value="acknowledged">Acknowledged</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="dismissed">Dismissed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="alert">Alert</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="trip">Trip</SelectItem>
                <SelectItem value="vehicle">Vehicle</SelectItem>
                <SelectItem value="driver">Driver</SelectItem>
                <SelectItem value="document">Document</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[35%] min-w-[200px]">
                    Notification Details
                  </TableHead>
                  <TableHead className="w-[20%] min-w-[150px]">
                    Recipients
                  </TableHead>
                  <TableHead className="w-[20%] min-w-[150px]">
                    Sender & Timing
                  </TableHead>
                  <TableHead className="w-[15%] min-w-[100px]">
                    Status
                  </TableHead>
                  <TableHead className="w-[10%] min-w-[80px] text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedDocuments.map((notification) => (
                  <TableRow key={notification.id}>
                    <TableCell className="break-words max-w-[300px]">
                      <div className="font-medium">{notification.title}</div>
                      <div className="text-sm text-muted-foreground truncate max-w-[250px]">
                        {notification.message}
                      </div>
                      {notification.relatedEntity && (
                        <div className="text-xs text-muted-foreground flex items-center">
                          <Link className="h-3 w-3 mr-1" />
                          {notification.relatedEntity.type}:{" "}
                          {notification.relatedEntity.name}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        ID: {notification.id}
                      </div>
                    </TableCell>

                    <TableCell className="break-words">
                      <div className="space-y-1">
                        <div className="text-sm flex items-center">
                          {notification.recipientType === "Broadcast" ? (
                            <Users className="h-3 w-3 mr-1" />
                          ) : (
                            <User className="h-3 w-3 mr-1" />
                          )}
                          {notification.recipientType}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {getRecipientSummary(notification)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Read by: {notification.readBy.length}
                        </div>
                        {notification.acknowledgedBy && (
                          <div className="text-xs text-green-600">
                            Acknowledged by:{" "}
                            {notification.acknowledgedBy.userName}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="break-words">
                      <div className="space-y-1">
                        <div className="text-sm">
                          {notification.sender.system
                            ? "System"
                            : notification.sender.userName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Created: {formatDate(notification.createdAt)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Updated: {formatDate(notification.updatedAt)}
                        </div>
                        {notification.scheduledFor && (
                          <div className="text-xs text-blue-600">
                            Scheduled: {formatDate(notification.scheduledFor)}
                          </div>
                        )}
                        {notification.expiresAt && (
                          <div className="text-xs text-orange-600">
                            Expires: {formatDate(notification.expiresAt)}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        {getStatusBadge(notification.status)}
                        {notification.actions &&
                          notification.actions.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                              {notification.actions.length} action(s)
                            </div>
                          )}
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleViewDetails(notification)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>

                          {notification.status === "Unread" && (
                            <DropdownMenuItem
                              onClick={() => handleMarkAsRead(notification.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Mark as Read
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuItem
                            onClick={() => handleEditNotification(notification)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Notification
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() =>
                              handleArchiveNotification(notification.id)
                            }
                          >
                            <Archive className="h-4 w-4 mr-2" />
                            Archive
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() =>
                              handleDeleteNotification(notification.id)
                            }
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {paginatedDocuments.map((notification) => (
              <div
                key={notification.id}
                className="border border-border rounded-xl p-4 shadow-sm bg-background space-y-2"
              >
                <div className="flex justify-between items-center">
                  <div className="font-medium text-sm">
                    {notification.title}
                  </div>
                  {getStatusBadge(notification.status)}
                </div>

                <div className="text-xs text-muted-foreground">
                  {notification.message}
                </div>

                {notification.relatedEntity && (
                  <div className="text-xs text-muted-foreground flex items-center">
                    <Link className="h-3 w-3 mr-1" />
                    {notification.relatedEntity.type}:{" "}
                    {notification.relatedEntity.name}
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  Recipient: {notification.recipientType}
                </div>

                <div className="text-xs text-muted-foreground">
                  Sender:{" "}
                  {notification.sender.system
                    ? "System"
                    : notification.sender.userName}
                </div>

                <div className="text-xs text-muted-foreground">
                  Created: {formatDate(notification.createdAt)}
                </div>

                {notification.scheduledFor && (
                  <div className="text-xs text-blue-600">
                    Scheduled: {formatDate(notification.scheduledFor)}
                  </div>
                )}
                {notification.expiresAt && (
                  <div className="text-xs text-orange-600">
                    Expires: {formatDate(notification.expiresAt)}
                  </div>
                )}

                <div className="flex justify-between items-center pt-2">
                  <div className="text-xs text-muted-foreground">
                    Read by {notification.readBy.length}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleViewDetails(notification)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>

                      {notification.status === "Unread" && (
                        <DropdownMenuItem
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark as Read
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuItem
                        onClick={() => handleEditNotification(notification)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() =>
                          handleArchiveNotification(notification.id)
                        }
                      >
                        <Archive className="h-4 w-4 mr-2" />
                        Archive
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() =>
                          handleDeleteNotification(notification.id)
                        }
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Show</span>
              <Select
                value={pageSize.toString()}
                onValueChange={(v) => {
                  setPageSize(Number(v));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-16">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 25, 50, 100].map((s) => (
                    <SelectItem key={s} value={s.toString()}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-muted-foreground">
                of {filteredNotifications.length} documents
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  First
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Prev
                </Button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let num;
                  if (totalPages <= 5) num = i + 1;
                  else if (currentPage <= 3) num = i + 1;
                  else if (currentPage >= totalPages - 2)
                    num = totalPages - 4 + i;
                  else num = currentPage - 2 + i;
                  return num;
                }).map((num) => (
                  <Button
                    key={num}
                    variant={currentPage === num ? "default" : "outline"}
                    size="icon"
                    onClick={() => setCurrentPage(num)}
                    className="w-9 h-9"
                  >
                    {num}
                  </Button>
                ))}

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  Last
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[900px] w-full max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-background text-foreground shadow-xl p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-semibold">
              Notification Details
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {selectedNotification && (
                <>
                  Complete information for notification:{" "}
                  <span className="font-medium">
                    {selectedNotification.title}
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {selectedNotification && (
              <>
                <section className="space-y-2">
                  <h4 className="font-semibold text-lg border-b border-border pb-1">
                    Basic Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Title:</span>{" "}
                      {selectedNotification.title}
                    </div>
                    <div>
                      <span className="font-medium">Type:</span>{" "}
                      {selectedNotification.type}
                    </div>
                    <div>
                      <span className="font-medium">Category:</span>{" "}
                      {selectedNotification.category}
                    </div>
                    <div>
                      <span className="font-medium">Severity:</span>{" "}
                      {selectedNotification.severity}
                    </div>
                    <div>
                      <span className="font-medium">Priority:</span>{" "}
                      {selectedNotification.priority}
                    </div>
                    <div>
                      <span className="font-medium">Status:</span>{" "}
                      {selectedNotification.status}
                    </div>
                    <div>
                      <span className="font-medium">Actionable:</span>{" "}
                      {selectedNotification.actionable ? "Yes" : "No"}
                    </div>
                    <div>
                      <span className="font-medium">Recipient Type:</span>{" "}
                      {selectedNotification.recipientType}
                    </div>
                  </div>
                  <div className="text-sm mt-2">
                    <span className="font-medium">Message:</span>
                    <div className="mt-1 p-4 rounded-lg bg-muted text-muted-foreground break-words shadow-sm">
                      {selectedNotification.message}
                    </div>
                  </div>
                </section>
                <section className="space-y-2">
                  <h4 className="font-semibold text-lg border-b border-border pb-1">
                    Recipients ({selectedNotification.recipients.length})
                  </h4>
                  {selectedNotification.recipients.length > 0 ? (
                    <div className="space-y-2">
                      {selectedNotification.recipients.map(
                        (recipient, index) => (
                          <div
                            key={index}
                            className="text-sm border border-border rounded-lg p-3 bg-muted text-foreground shadow-sm"
                          >
                            {recipient.userName && (
                              <div>
                                <span className="font-medium">User:</span>{" "}
                                {recipient.userName}
                              </div>
                            )}
                            {recipient.roleName && (
                              <div>
                                <span className="font-medium">Role:</span>{" "}
                                {recipient.roleName}
                              </div>
                            )}
                            {recipient.departmentName && (
                              <div>
                                <span className="font-medium">Department:</span>{" "}
                                {recipient.departmentName}
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No specific recipients
                    </div>
                  )}
                </section>
                <section className="space-y-2">
                  <h4 className="font-semibold text-lg border-b border-border pb-1">
                    Sender Information
                  </h4>
                  <div className="text-sm text-foreground">
                    {selectedNotification.sender.system ? (
                      <div className="italic text-muted-foreground">
                        System Generated
                      </div>
                    ) : (
                      <>
                        <div>
                          <span className="font-medium">Sender:</span>{" "}
                          {selectedNotification.sender.userName}
                        </div>
                        <div>
                          <span className="font-medium">User ID:</span>{" "}
                          {selectedNotification.sender.userId}
                        </div>
                      </>
                    )}
                  </div>
                </section>
                {selectedNotification.relatedEntity && (
                  <section className="space-y-2">
                    <h4 className="font-semibold text-lg border-b border-border pb-1">
                      Related Entity
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-foreground">
                      <div>
                        <span className="font-medium">Type:</span>{" "}
                        {selectedNotification.relatedEntity.type}
                      </div>
                      <div>
                        <span className="font-medium">ID:</span>{" "}
                        {selectedNotification.relatedEntity.id}
                      </div>
                      <div>
                        <span className="font-medium">Name:</span>{" "}
                        {selectedNotification.relatedEntity.name}
                      </div>
                    </div>
                  </section>
                )}
                {selectedNotification.actions?.length ? (
                  <section className="space-y-2">
                    <h4 className="font-semibold text-lg border-b border-border pb-1">
                      Available Actions
                    </h4>
                    <div className="space-y-2">
                      {selectedNotification.actions.map((action, index) => (
                        <div
                          key={index}
                          className="border border-border rounded-lg p-3 bg-muted text-foreground shadow-sm text-sm"
                        >
                          <div className="font-medium">{action.label}</div>
                          <div className="text-muted-foreground">
                            Action: {action.action}
                          </div>
                          {action.parameters && (
                            <div className="text-muted-foreground">
                              Parameters: {JSON.stringify(action.parameters)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                ) : null}
                {selectedNotification.readBy?.length > 0 && (
                  <section className="space-y-2">
                    <h4 className="font-semibold text-lg border-b border-border pb-1">
                      Read By ({selectedNotification.readBy.length})
                    </h4>
                    <div className="space-y-1 text-sm">
                      {selectedNotification.readBy.map((readBy, index) => (
                        <div
                          key={index}
                          className="flex justify-between border-b border-border py-1"
                        >
                          <span>{readBy.userName}</span>
                          <span className="text-muted-foreground">
                            {formatDate(readBy.readAt)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
                {selectedNotification.acknowledgedBy && (
                  <section className="space-y-2">
                    <h4 className="font-semibold text-lg border-b border-border pb-1">
                      Acknowledgment
                    </h4>
                    <div className="text-sm border border-border rounded-lg p-4 bg-muted shadow-sm">
                      <div>
                        <span className="font-medium">Acknowledged by:</span>{" "}
                        {selectedNotification.acknowledgedBy.userName}
                      </div>
                      <div>
                        <span className="font-medium">Date:</span>{" "}
                        {formatDate(
                          selectedNotification.acknowledgedBy.acknowledgedAt
                        )}
                      </div>
                      {selectedNotification.acknowledgedBy.comments && (
                        <div>
                          <span className="font-medium">Comments:</span>{" "}
                          {selectedNotification.acknowledgedBy.comments}
                        </div>
                      )}
                    </div>
                  </section>
                )}
                {selectedNotification.tags?.length > 0 && (
                  <section className="space-y-2">
                    <h4 className="font-semibold text-lg border-b border-border pb-1">
                      Tags
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedNotification.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs px-2 py-1 bg-muted text-foreground rounded-full"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </section>
                )}
                <section className="space-y-2">
                  <h4 className="font-semibold text-lg border-b border-border pb-1">
                    Timing Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-foreground">
                    <div>
                      <span className="font-medium">Created:</span>{" "}
                      {formatDate(selectedNotification.createdAt)}
                    </div>
                    <div>
                      <span className="font-medium">Last Updated:</span>{" "}
                      {formatDate(selectedNotification.updatedAt)}
                    </div>
                    {selectedNotification.scheduledFor && (
                      <div>
                        <span className="font-medium">Scheduled For:</span>{" "}
                        {formatDate(selectedNotification.scheduledFor)}
                      </div>
                    )}
                    {selectedNotification.expiresAt && (
                      <div>
                        <span className="font-medium">Expires At:</span>{" "}
                        {formatDate(selectedNotification.expiresAt)}
                      </div>
                    )}
                  </div>
                </section>
              </>
            )}
          </div>
          <DialogFooter className="mt-6 flex justify-end">
            <Button
              variant="default"
              onClick={() => setIsDetailsDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Compose/Edit Notification Dialog */}
      <Dialog open={isComposeDialogOpen} onOpenChange={setIsComposeDialogOpen}>
        <DialogContent className="sm:max-w-[650px] w-full rounded-2xl border border-border bg-background text-foreground shadow-xl p-6 overflow-y-auto max-h-[90vh]">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-semibold">
              {selectedNotification
                ? "Edit Notification"
                : "Send New Notification"}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {selectedNotification
                ? "Edit the existing notification details"
                : "Create and send a notification to users, roles, or departments"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleFormChange("type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Info">Info</SelectItem>
                    <SelectItem value="Success">Success</SelectItem>
                    <SelectItem value="Warning">Warning</SelectItem>
                    <SelectItem value="Error">Error</SelectItem>
                    <SelectItem value="Alert">Alert</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.type && (
                  <p className="text-xs text-destructive">{formErrors.type}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleFormChange("category", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Trip">Trip</SelectItem>
                    <SelectItem value="Vehicle">Vehicle</SelectItem>
                    <SelectItem value="Driver">Driver</SelectItem>
                    <SelectItem value="Document">Document</SelectItem>
                    <SelectItem value="System">System</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Emergency">Emergency</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.category && (
                  <p className="text-xs text-destructive">
                    {formErrors.category}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                placeholder="Notification title"
                value={formData.title}
                onChange={(e) => handleFormChange("title", e.target.value)}
                className="bg-muted text-foreground border-border"
                aria-invalid={!!formErrors.title}
              />
              {formErrors.title && (
                <p className="text-xs text-destructive">{formErrors.title}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                placeholder="Notification message content..."
                rows={4}
                value={formData.message}
                onChange={(e) => handleFormChange("message", e.target.value)}
                className="bg-muted text-foreground border-border"
                aria-invalid={!!formErrors.message}
              />
              {formErrors.message && (
                <p className="text-xs text-destructive">{formErrors.message}</p>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => handleFormChange("priority", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Normal">Normal</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.priority && (
                  <p className="text-xs text-destructive">
                    {formErrors.priority}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Severity</Label>
                <Select
                  value={formData.severity}
                  onValueChange={(value) => handleFormChange("severity", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.severity && (
                  <p className="text-xs text-destructive">
                    {formErrors.severity}
                  </p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Recipients</Label>
              <div className="space-y-2">
                <Select
                  value={formData.recipientType}
                  onValueChange={(value) =>
                    handleFormChange("recipientType", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select recipient type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="User">Specific User</SelectItem>
                    <SelectItem value="Role">Role</SelectItem>
                    <SelectItem value="Department">Department</SelectItem>
                    <SelectItem value="Broadcast">All Users</SelectItem>
                  </SelectContent>
                </Select>
                {formErrors.recipientType && (
                  <p className="text-xs text-destructive">
                    {formErrors.recipientType}
                  </p>
                )}
                {formData.recipientType !== "Broadcast" && (
                  <>
                    <Input
                      placeholder="Enter recipient details"
                      value={formData.recipientDetails}
                      onChange={(e) =>
                        handleFormChange("recipientDetails", e.target.value)
                      }
                      className="bg-muted text-foreground border-border"
                      aria-invalid={!!formErrors.recipientDetails}
                    />
                    {formErrors.recipientDetails && (
                      <p className="text-xs text-destructive">
                        {formErrors.recipientDetails}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="actionable"
                checked={formData.actionable}
                onCheckedChange={(checked) =>
                  handleFormChange("actionable", checked)
                }
              />
              <Label htmlFor="actionable">
                This notification requires action
              </Label>
            </div>
            <div className="space-y-2">
              <Label>Schedule (Optional)</Label>
              <Input
                type="datetime-local"
                value={formData.scheduledFor}
                onChange={(e) =>
                  handleFormChange("scheduledFor", e.target.value)
                }
                className="bg-muted text-foreground border-border"
              />
            </div>
          </div>
          <DialogFooter className="mt-6 flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsComposeDialogOpen(false);
                setSelectedNotification(null);
                setFormErrors({});
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveNotification}
              disabled={isSubmitting}
              aria-label={
                selectedNotification
                  ? "Update Notification"
                  : "Send Notification"
              }
            >
              {isSubmitting
                ? "Saving..."
                : selectedNotification
                ? "Update Notification"
                : "Send Notification"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent className="sm:max-w-[500px] w-full rounded-2xl border border-border bg-background text-foreground shadow-xl p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-semibold">
              Take Action
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Execute the selected action for the notification.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedAction && (
              <>
                <div className="space-y-2">
                  <Label>Action</Label>
                  <Input
                    value={selectedAction.label}
                    readOnly
                    className="bg-muted text-foreground border-border"
                  />
                </div>
                {selectedAction.parameters && (
                  <div className="space-y-2">
                    <Label>Parameters</Label>
                    <Textarea
                      value={JSON.stringify(selectedAction.parameters, null, 2)}
                      readOnly
                      rows={4}
                      className="bg-muted text-foreground border-border"
                    />
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter className="mt-6 flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsActionDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleActionSubmit}>Execute Action</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
