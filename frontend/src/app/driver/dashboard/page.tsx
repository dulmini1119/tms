"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Car, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type Assignment = {
  id: string;
  requestNumber: string;
  employee: string;
  destination: string;
  fromLocation: string;
  scheduledTime: string;
  status: "scheduled" | "active" | "completed";
  distance: string;
};

type DashboardData = {
  user: {
    id: string;
    name: string;
  };
  stats: {
    todayTrips: number;
    activeTrips: number;
    completedTrips: number;
    totalDistance: number;
  };
  assignments: Assignment[];
  currentVehicle: {
    make: string;
    model: string;
    year: string;
    licensePlate: string;
  } | null;
};

export default function DriverDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/portal/driver/dashboard", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load driver dashboard");
      const payload: DashboardData = await res.json();
      setData(payload);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load dashboard");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const active = useMemo(
    () => data?.assignments.find((a) => a.status === "active") || null,
    [data],
  );

  const updateTrip = async (assignmentId: string, action: "start" | "end") => {
    try {
      const res = await fetch(`/portal/driver/assignments/${assignmentId}/${action}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error(`Failed to ${action} trip`);
      toast.success(`Trip ${action === "start" ? "started" : "completed"}`);
      fetchDashboard();
    } catch (error) {
      console.error(error);
      toast.error(`Could not ${action} trip`);
    }
  };

  if (loading) return <div className="p-6">Loading driver dashboard...</div>;
  if (!data) return <div className="p-6">No data available.</div>;

  return (
    <div className="space-y-4">
      <div className="p-3">
        <h1 className="text-2xl font-bold">Welcome, {data.user.name}</h1>
        <p className="text-muted-foreground text-xs">Live driver dashboard</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Today Trips</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{data.stats.todayTrips}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Active</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{data.stats.activeTrips}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Completed</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{data.stats.completedTrips}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Distance</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{data.stats.totalDistance} km</CardContent>
        </Card>
      </div>

      {active && (
        <Card className="border-green-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-4 w-4" />
              Active Trip
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="font-medium">{active.requestNumber}</p>
              <p className="text-sm text-muted-foreground">
                {active.fromLocation} to {active.destination}
              </p>
            </div>
            <Button onClick={() => updateTrip(active.id, "end")}>End Trip</Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Assignments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.assignments.slice(0, 6).map((a) => (
            <div key={a.id} className="flex items-center justify-between border rounded p-3">
              <div>
                <p className="font-medium">{a.requestNumber}</p>
                <p className="text-sm text-muted-foreground">{a.employee}</p>
                <p className="text-sm text-muted-foreground">
                  {a.fromLocation} to {a.destination} ({a.distance})
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={a.status === "active" ? "default" : a.status === "completed" ? "secondary" : "outline"}>
                  {a.status}
                </Badge>
                {a.status === "scheduled" && (
                  <Button size="sm" onClick={() => updateTrip(a.id, "start")}>
                    Start
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {data.currentVehicle && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-4 w-4" />
              Current Vehicle
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.currentVehicle.make} {data.currentVehicle.model} ({data.currentVehicle.year}) -{" "}
            {data.currentVehicle.licensePlate}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
