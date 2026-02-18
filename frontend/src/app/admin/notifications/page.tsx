"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, Eye, Loader2, Pencil, Plus, RefreshCw, Search, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { fetchAPI } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { io } from "socket.io-client";

type NotificationType = "Info" | "Success" | "Warning" | "Error" | "Alert";
type NotificationCategory = "Trip" | "Vehicle" | "Driver" | "Document" | "System" | "Finance" | "Emergency" | "Maintenance";
type NotificationSeverity = "Low" | "Medium" | "High" | "Critical";
type NotificationPriority = "Normal" | "High" | "Urgent";
type RecipientType = "User" | "Role" | "Department" | "Broadcast";
type NotificationStatus = "Unread" | "Read";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  category: NotificationCategory;
  severity: NotificationSeverity;
  priority: NotificationPriority;
  status: NotificationStatus;
  recipientType: RecipientType;
  recipients: Array<{
    userId?: string;
    userName?: string;
    roleName?: string;
    departmentName?: string;
  }>;
  sender: {
    userName?: string;
    system: boolean;
  };
  actionable: boolean;
  scheduledFor?: string;
  createdAt: string;
  updatedAt: string;
};

type UserItem = { id: string; first_name: string; last_name: string; email: string };
type RoleItem = { id: string; name: string; code: string };
type DepartmentItem = { id: string; name: string; code?: string };

type NotificationResponse = {
  success?: boolean;
  data?: {
    notifications?: Notification[];
    meta?: { page: number; limit: number; total: number; totalPages: number };
  };
};

type UsersResponse = { data?: { users?: UserItem[] } };
type RolesResponse = { data?: RoleItem[] };
type DepartmentsResponse = { data?: { departments?: DepartmentItem[] } };

type ComposeForm = {
  title: string;
  message: string;
  type: NotificationType | "";
  category: NotificationCategory | "";
  severity: NotificationSeverity | "";
  priority: NotificationPriority | "";
  recipientType: RecipientType | "";
  recipientDetails: string;
  scheduledFor: string;
};

const defaultForm: ComposeForm = {
  title: "",
  message: "",
  type: "",
  category: "",
  severity: "",
  priority: "",
  recipientType: "",
  recipientDetails: "",
  scheduledFor: "",
};

const formatDate = (value?: string) => (value ? new Date(value).toLocaleString() : "-");

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "read" | "unread">("all");
  const [type, setType] = useState<"all" | NotificationType>("all");
  const [category, setCategory] = useState<"all" | NotificationCategory>("all");

  const [selected, setSelected] = useState<Notification | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [editing, setEditing] = useState<Notification | null>(null);
  const [form, setForm] = useState<ComposeForm>(defaultForm);

  const [users, setUsers] = useState<UserItem[]>([]);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(meta.page),
        limit: String(meta.limit),
      });
      if (status !== "all") params.set("status", status);
      if (type !== "all") params.set("type", type);
      if (category !== "all") params.set("category", category);

      const response = (await fetchAPI(`/notifications?${params.toString()}`)) as NotificationResponse;
      const list = response?.data?.notifications ?? [];
      const nextMeta = response?.data?.meta;

      setNotifications(list);
      if (nextMeta) {
        setMeta((prev) => ({ ...prev, ...nextMeta }));
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [meta.page, meta.limit, status, type, category]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const socket = io(socketUrl, {
      path: "/socket.io",
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
    });

    socket.on("connect", () => {
      setSocketConnected(true);
      socket.emit("join-superadmin");
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);
    });

    socket.on("critical-notification", (incoming: Notification) => {
      setNotifications((prev) => [incoming, ...prev.filter((item) => item.id !== incoming.id)]);
      setMeta((prev) => ({ ...prev, total: prev.total + 1 }));
      toast.info(`New notification: ${incoming.title}`);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!composeOpen) return;
    const loadLookups = async () => {
      setLookupLoading(true);
      try {
        const [u, r, d] = await Promise.all([
          fetchAPI("/users?limit=200"),
          fetchAPI("/roles"),
          fetchAPI("/departments?limit=200"),
        ]);
        setUsers((u as UsersResponse)?.data?.users ?? []);
        setRoles((r as RolesResponse)?.data ?? []);
        setDepartments((d as DepartmentsResponse)?.data?.departments ?? []);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load recipient options");
      } finally {
        setLookupLoading(false);
      }
    };
    loadLookups();
  }, [composeOpen]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return notifications;
    return notifications.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        (n.message || "").toLowerCase().includes(q) ||
        (n.sender.userName || "").toLowerCase().includes(q)
    );
  }, [notifications, search]);

  const stats = useMemo(
    () => ({
      total: notifications.length,
      unread: notifications.filter((n) => n.status === "Unread").length,
      critical: notifications.filter((n) => n.severity === "Critical").length,
      scheduled: notifications.filter((n) => !!n.scheduledFor).length,
    }),
    [notifications]
  );

  const resetForm = () => {
    setForm(defaultForm);
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setComposeOpen(true);
  };

  const openEdit = (n: Notification) => {
    setEditing(n);
    setForm({
      title: n.title,
      message: n.message,
      type: n.type,
      category: n.category,
      severity: n.severity,
      priority: n.priority,
      recipientType: n.recipientType,
      recipientDetails: n.recipients[0]?.userId || n.recipients[0]?.roleName || "",
      scheduledFor: n.scheduledFor ? new Date(n.scheduledFor).toISOString().slice(0, 16) : "",
    });
    setComposeOpen(true);
  };

  const markAsRead = async (id: string) => {
    try {
      await fetchAPI(`/notifications/${id}`, { method: "PATCH", body: { is_read: true } });
      toast.success("Marked as read");
      await loadNotifications();
    } catch (error) {
      console.error(error);
      toast.error("Failed to mark as read");
    }
  };

  const removeNotification = async (id: string) => {
    if (!confirm("Delete this notification?")) return;
    try {
      await fetchAPI(`/notifications/${id}`, { method: "DELETE" });
      toast.success("Notification deleted");
      await loadNotifications();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete notification");
    }
  };

  const validateForm = () => {
    if (!form.title.trim() || !form.message.trim()) return "Title and message are required";
    if (!form.type || !form.category || !form.severity || !form.priority || !form.recipientType) return "Please complete all required fields";
    if (form.recipientType !== "Broadcast" && !form.recipientDetails) return "Recipient is required";
    return null;
  };

  const submitForm = async () => {
    const error = validateForm();
    if (error) {
      toast.error(error);
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        message: form.message.trim(),
        type: form.type,
        category: form.category,
        severity: form.severity,
        priority: form.priority,
        recipientType: form.recipientType,
        recipientDetails: form.recipientType === "Broadcast" ? "ALL" : form.recipientDetails,
        scheduledFor: form.scheduledFor ? new Date(form.scheduledFor).toISOString() : undefined,
      };

      if (editing) {
        await fetchAPI(`/notifications/${editing.id}`, { method: "PATCH", body: payload });
        toast.success("Notification updated");
      } else {
        await fetchAPI("/notifications", { method: "POST", body: payload });
        toast.success("Notification sent");
      }
      setComposeOpen(false);
      resetForm();
      await loadNotifications();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save notification");
    } finally {
      setSaving(false);
    }
  };

  const recipientText = (n: Notification) => {
    if (n.recipientType === "Broadcast") return "All users";
    const item = n.recipients?.[0];
    return item?.userName || item?.roleName || item?.departmentName || n.recipientType;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="p-2">
          <h1 className="text-2xl">NOTIFICATIONS</h1>
          <p className="text-xs text-muted-foreground">Send, monitor, and manage system notifications.</p>
          <p className="text-xs text-muted-foreground">
            Realtime: {socketConnected ? "Connected" : "Disconnected"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadNotifications}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Compose
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{stats.total}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Unread</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{stats.unread}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Critical</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{stats.critical}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Scheduled</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{stats.scheduled}</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" placeholder="Search notifications" />
            </div>
            <Select value={status} onValueChange={(v: "all" | "read" | "unread") => setStatus(v)}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
              </SelectContent>
            </Select>
            <Select value={type} onValueChange={(v) => setType(v as "all" | NotificationType)}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Info">Info</SelectItem>
                <SelectItem value="Success">Success</SelectItem>
                <SelectItem value="Warning">Warning</SelectItem>
                <SelectItem value="Error">Error</SelectItem>
                <SelectItem value="Alert">Alert</SelectItem>
              </SelectContent>
            </Select>
            <Select value={category} onValueChange={(v) => setCategory(v as "all" | NotificationCategory)}>
              <SelectTrigger className="w-[170px]"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
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
          </div>

          <div className="border rounded-md overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="py-8 text-center"><Loader2 className="inline-block h-4 w-4 animate-spin" /></TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No notifications found.</TableCell></TableRow>
                ) : (
                  filtered.map((n) => (
                    <TableRow key={n.id}>
                      <TableCell>
                        <div className="font-medium">{n.title}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1">{n.message}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{n.type}</Badge>
                      </TableCell>
                      <TableCell>{recipientText(n)}</TableCell>
                      <TableCell>
                        <Badge variant={n.status === "Unread" ? "destructive" : "secondary"}>{n.status}</Badge>
                      </TableCell>
                      <TableCell>{formatDate(n.createdAt)}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="outline" onClick={() => { setSelected(n); setDetailsOpen(true); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {n.status === "Unread" ? (
                          <Button size="sm" variant="outline" onClick={() => markAsRead(n.id)}>
                            <Bell className="h-4 w-4" />
                          </Button>
                        ) : null}
                        <Button size="sm" variant="outline" onClick={() => openEdit(n)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => removeNotification(n.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Page {meta.page} of {Math.max(meta.totalPages, 1)}</span>
            <div className="space-x-2">
              <Button variant="outline" size="sm" disabled={meta.page <= 1} onClick={() => setMeta((p) => ({ ...p, page: p.page - 1 }))}>Previous</Button>
              <Button variant="outline" size="sm" disabled={meta.page >= meta.totalPages} onClick={() => setMeta((p) => ({ ...p, page: p.page + 1 }))}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notification Details</DialogTitle>
            <DialogDescription>Full information for the selected notification.</DialogDescription>
          </DialogHeader>
          {selected ? (
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Title:</span> {selected.title}</p>
              <p><span className="font-medium">Message:</span> {selected.message}</p>
              <p><span className="font-medium">Type:</span> {selected.type}</p>
              <p><span className="font-medium">Category:</span> {selected.category}</p>
              <p><span className="font-medium">Severity:</span> {selected.severity}</p>
              <p><span className="font-medium">Priority:</span> {selected.priority}</p>
              <p><span className="font-medium">Recipient:</span> {recipientText(selected)}</p>
              <p><span className="font-medium">Sender:</span> {selected.sender.system ? "System" : selected.sender.userName || "-"}</p>
              <p><span className="font-medium">Created:</span> {formatDate(selected.createdAt)}</p>
              <p><span className="font-medium">Updated:</span> {formatDate(selected.updatedAt)}</p>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Notification" : "Compose Notification"}</DialogTitle>
            <DialogDescription>Send notification to user, role, department, or broadcast.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Message</Label>
              <Textarea rows={4} value={form.message} onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v: NotificationType) => setForm((p) => ({ ...p, type: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Info">Info</SelectItem>
                    <SelectItem value="Success">Success</SelectItem>
                    <SelectItem value="Warning">Warning</SelectItem>
                    <SelectItem value="Error">Error</SelectItem>
                    <SelectItem value="Alert">Alert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v: NotificationCategory) => setForm((p) => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
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
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Severity</Label>
                <Select value={form.severity} onValueChange={(v: NotificationSeverity) => setForm((p) => ({ ...p, severity: v }))}>
                  <SelectTrigger><SelectValue placeholder="Severity" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v: NotificationPriority) => setForm((p) => ({ ...p, priority: v }))}>
                  <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Normal">Normal</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Recipient Type</Label>
              <Select value={form.recipientType} onValueChange={(v: RecipientType) => setForm((p) => ({ ...p, recipientType: v, recipientDetails: "" }))}>
                <SelectTrigger><SelectValue placeholder="Select recipient type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="User">User</SelectItem>
                  <SelectItem value="Role">Role</SelectItem>
                  <SelectItem value="Department">Department</SelectItem>
                  <SelectItem value="Broadcast">Broadcast</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.recipientType && form.recipientType !== "Broadcast" ? (
              <div className="space-y-1">
                <Label>Recipient</Label>
                {lookupLoading ? (
                  <div className="text-sm text-muted-foreground">Loading recipients...</div>
                ) : (
                  <Select value={form.recipientDetails} onValueChange={(v) => setForm((p) => ({ ...p, recipientDetails: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select recipient" /></SelectTrigger>
                    <SelectContent>
                      {form.recipientType === "User" &&
                        users.map((u) => (
                          <SelectItem key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.email})</SelectItem>
                        ))}
                      {form.recipientType === "Role" &&
                        roles.map((r) => (
                          <SelectItem key={r.id} value={r.code}>{r.name}</SelectItem>
                        ))}
                      {form.recipientType === "Department" &&
                        departments.map((d) => (
                          <SelectItem key={d.id} value={d.id}>{d.name}{d.code ? ` (${d.code})` : ""}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            ) : null}

            <div className="space-y-1">
              <Label>Schedule (Optional)</Label>
              <Input type="datetime-local" value={form.scheduledFor} onChange={(e) => setForm((p) => ({ ...p, scheduledFor: e.target.value }))} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setComposeOpen(false); resetForm(); }} disabled={saving}>Cancel</Button>
            <Button onClick={submitForm} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              {editing ? "Update" : "Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
