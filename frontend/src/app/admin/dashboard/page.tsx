"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Car,
  CheckCircle2,
  Clock3,
  RefreshCw,
  Route,
  Users,
  XCircle,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type DashboardStats = {
  totalUsers: number;
  activeUsers: number;
  totalVehicles: number;
  availableVehicles: number;
  totalTrips: number;
  pendingTrips: number;
  expiringAlerts: number;
  failedAudits: number;
};

type AlertItem = {
  id: string;
  entityName: string;
  documentName: string;
  status: string;
  priority: string;
  daysToExpiry: number;
};

type ActivityItem = {
  id: string;
  action: string;
  actor: string;
  module: string;
  status: string;
  timestamp: string;
};

type DashboardData = {
  stats: DashboardStats;
  tripStatusData: Array<{ name: string; value: number }>;
  vehicleTypeData: Array<{ name: string; value: number }>;
  alerts: AlertItem[];
  activities: ActivityItem[];
};

type BackendAlert = {
  id: string;
  entity_name?: string;
  document_name?: string;
  status?: string;
  priority?: string;
  days_to_expiry?: number | string | null;
};

type BackendAuditLog = {
  id: string;
  action?: string;
  userName?: string;
  module?: string;
  status?: string;
  timestamp?: string;
  createdAt?: string;
};

const chartColors = ["#0ea5e9", "#f59e0b", "#22c55e", "#ef4444", "#8b5cf6", "#14b8a6"];

const initialData: DashboardData = {
  stats: {
    totalUsers: 0,
    activeUsers: 0,
    totalVehicles: 0,
    availableVehicles: 0,
    totalTrips: 0,
    pendingTrips: 0,
    expiringAlerts: 0,
    failedAudits: 0,
  },
  tripStatusData: [],
  vehicleTypeData: [],
  alerts: [],
  activities: [],
};

const parseJsonSafe = async (response: Response) => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const toCountMap = (values: string[]) => {
  return values.reduce<Record<string, number>>((acc, value) => {
    const normalized = value?.trim() ? value : "Unknown";
    acc[normalized] = (acc[normalized] ?? 0) + 1;
    return acc;
  }, {});
};

const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  const normalized = status.toLowerCase();
  if (normalized.includes("expired") || normalized.includes("failed")) return "destructive";
  if (normalized.includes("pending") || normalized.includes("process")) return "secondary";
  if (normalized.includes("active") || normalized.includes("success") || normalized.includes("renewed")) return "default";
  return "outline";
};

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData>(initialData);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const getAuthHeaders = useCallback((): Record<string, string> => {
    const token = localStorage.getItem("authToken") || localStorage.getItem("auth_token");
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }, []);

  const fetchWithAuth = useCallback(
    async (url: string) => {
      const response = await fetch(url, {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (!response.ok) throw new Error(`Request failed: ${url}`);
      return parseJsonSafe(response);
    },
    [getAuthHeaders],
  );

  const loadDashboard = useCallback(async () => {
    const settled = await Promise.allSettled([
      fetchWithAuth("/users?page=1&limit=1"),
      fetchWithAuth("/users?page=1&limit=1&status=Active"),
      fetchWithAuth("/vehicles"),
      fetchWithAuth("/trip-requests?page=1&pageSize=100"),
      fetchWithAuth("/trip-requests?page=1&pageSize=1&status=Pending"),
      fetchWithAuth("/expiry-alerts"),
      fetchWithAuth("/audit-logs?page=1&limit=6"),
      fetchWithAuth("/audit-logs?page=1&limit=1&status=Failed"),
    ]);

    const getValue = (index: number) => (settled[index].status === "fulfilled" ? settled[index].value : null);

    const usersAll = getValue(0);
    const usersActive = getValue(1);
    const vehiclesRes = getValue(2);
    const tripsRes = getValue(3);
    const pendingTripsRes = getValue(4);
    const alertsRes = getValue(5);
    const auditsRes = getValue(6);
    const failedAuditsRes = getValue(7);

    const totalUsers = Number(usersAll?.data?.pagination?.total ?? 0);
    const activeUsers = Number(usersActive?.data?.pagination?.total ?? 0);

    const vehicles = Array.isArray(vehiclesRes?.data)
      ? vehiclesRes.data
      : Array.isArray(vehiclesRes)
        ? vehiclesRes
        : [];

    const totalVehicles = vehicles.length;
    const availableVehicles = vehicles.filter(
      (v: { availability_status?: string }) =>
        (v.availability_status || "").toLowerCase() === "available",
    ).length;

    const trips = Array.isArray(tripsRes?.data) ? tripsRes.data : [];
    const totalTrips = Number(tripsRes?.meta?.total ?? trips.length ?? 0);
    const pendingTrips = Number(pendingTripsRes?.meta?.total ?? 0);

    const tripStatusCounts = toCountMap(
      trips.map((trip: { status?: string }) => trip.status || "Unknown"),
    );
    const tripStatusData = Object.entries(tripStatusCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    const vehicleTypeCounts = toCountMap(
      vehicles.map((vehicle: { vehicle_type?: string }) => vehicle.vehicle_type || "Unknown"),
    );
    const vehicleTypeData = Object.entries(vehicleTypeCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    const alertRows: BackendAlert[] = Array.isArray(alertsRes) ? alertsRes : [];

    const alerts = alertRows
      .map((alert) => ({
        id: alert.id,
        entityName: alert.entity_name || "Unknown",
        documentName: alert.document_name || "Unknown document",
        status: alert.status || "Unknown",
        priority: alert.priority || "Low",
        daysToExpiry: Number(alert.days_to_expiry ?? 0),
      }))
      .sort((a, b) => a.daysToExpiry - b.daysToExpiry)
      .slice(0, 6);

    const expiringAlerts = alertRows.filter((a) =>
      ["expired", "expiring_soon", "under_process"].includes((a.status || "").toLowerCase()),
    ).length;

    const auditLogs: BackendAuditLog[] = Array.isArray(auditsRes?.data?.logs) ? auditsRes.data.logs : [];

    const activities = auditLogs.length
      ? auditLogs.map((log) => ({
          id: log.id,
          action: log.action || "Activity",
          actor: log.userName || "System",
          module: log.module || "system",
          status: log.status || "Success",
          timestamp: log.timestamp || log.createdAt || new Date().toISOString(),
        }))
      : [];

    const failedAudits = Number(failedAuditsRes?.data?.meta?.total ?? 0);

    setDashboardData({
      stats: {
        totalUsers,
        activeUsers,
        totalVehicles,
        availableVehicles,
        totalTrips,
        pendingTrips,
        expiringAlerts,
        failedAudits,
      },
      tripStatusData,
      vehicleTypeData,
      alerts,
      activities,
    });

    const failedCount = settled.filter((s) => s.status === "rejected").length;
    setError(failedCount > 0 ? "Some dashboard data could not be loaded." : null);
    setLastUpdated(new Date().toISOString());
  }, [fetchWithAuth]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      await loadDashboard();
      setLoading(false);
    };
    run();
  }, [loadDashboard]);

  const summaryCards = useMemo(
    () => [
      { title: "Total Users", value: dashboardData.stats.totalUsers, sub: `${dashboardData.stats.activeUsers} active`, icon: Users },
      { title: "Fleet Vehicles", value: dashboardData.stats.totalVehicles, sub: `${dashboardData.stats.availableVehicles} available`, icon: Car },
      { title: "Trip Requests", value: dashboardData.stats.totalTrips, sub: `${dashboardData.stats.pendingTrips} pending`, icon: Route },
      { title: "Expiry Alerts", value: dashboardData.stats.expiringAlerts, sub: `${dashboardData.stats.failedAudits} failed audits`, icon: AlertTriangle },
    ],
    [dashboardData.stats],
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3">
        <div>
          <h1 className="text-2xl">DASHBOARD</h1>
          <p className="text-xs text-muted-foreground">
            Central admin overview for users, vehicles, trips, alerts, and audit activity
          </p>
        </div>
        <Button variant="outline" onClick={onRefresh} disabled={refreshing || loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-sm text-amber-600">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "..." : card.value.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{loading ? "Loading..." : card.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Trip Status Distribution</CardTitle>
            <CardDescription>Breakdown of recent trip request statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={dashboardData.tripStatusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {dashboardData.tripStatusData.map((entry, index) => (
                    <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Vehicle Type Distribution</CardTitle>
            <CardDescription>Current fleet grouped by vehicle type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={dashboardData.vehicleTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>System Alerts</CardTitle>
              <CardDescription>Top expiry and renewal alerts requiring attention</CardDescription>
            </div>
            <a href="/admin/expiry-alerts">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </a>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboardData.alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active alerts.</p>
            ) : (
              dashboardData.alerts.map((alert) => (
                <div key={alert.id} className="flex items-start gap-3">
                  {alert.daysToExpiry < 0 ? (
                    <XCircle className="mt-0.5 h-5 w-5 text-red-500" />
                  ) : alert.daysToExpiry <= 30 ? (
                    <Clock3 className="mt-0.5 h-5 w-5 text-amber-500" />
                  ) : (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-blue-500" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{alert.entityName}</p>
                      <Badge variant={getStatusBadgeVariant(alert.status)}>{alert.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{alert.documentName}</p>
                    <p className="text-xs text-muted-foreground">
                      {alert.daysToExpiry < 0
                        ? `Overdue by ${Math.abs(alert.daysToExpiry)} days`
                        : `${alert.daysToExpiry} days remaining`}{" "}
                      | Priority: {alert.priority}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest events from the audit trail</CardDescription>
            </div>
            <a href="/admin/audit-logs">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </a>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboardData.activities.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity.</p>
            ) : (
              dashboardData.activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="mt-2 h-2 w-2 rounded-full bg-primary" />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{activity.action}</p>
                      <Badge variant={getStatusBadgeVariant(activity.status)}>{activity.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {activity.actor} | {activity.module}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {lastUpdated && (
        <p className="px-3 text-xs text-muted-foreground">Last updated: {new Date(lastUpdated).toLocaleString()}</p>
      )}
    </div>
  );
}
