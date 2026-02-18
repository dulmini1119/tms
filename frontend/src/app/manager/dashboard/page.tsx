"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type TeamDashboardData = {
  user: {
    name: string;
    role: string;
    department: string;
    businessUnit: string;
  };
  stats: {
    pendingApprovals: number;
    totalTeamTrips: number;
    approvedThisMonth: number;
    teamMembers: number;
  };
  pendingRequests: Array<{
    id: string;
    requestNumber: string;
    employee: string;
    department: string;
    destination: string;
    date: string;
    time: string;
    purpose: string;
    priority: string;
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    employee: string;
    tripId: string;
    timestamp: string;
  }>;
};

export default function ManagerDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TeamDashboardData | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/portal/team/dashboard", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load dashboard");
      const payload: TeamDashboardData = await res.json();
      setData(payload);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load manager dashboard");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <div className="p-6">Loading dashboard...</div>;
  if (!data) return <div className="p-6">No dashboard data.</div>;

  return (
    <div className="space-y-4">
      <div className="p-3">
        <h1 className="text-2xl font-bold">Welcome, {data.user.name}</h1>
        <p className="text-muted-foreground text-xs">
          Manager Dashboard - {data.user.businessUnit || data.user.department}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Pending</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{data.stats.pendingApprovals}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Team Members</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{data.stats.teamMembers}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Approved This Month</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{data.stats.approvedThisMonth}</CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Team Trips</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{data.stats.totalTeamTrips}</CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Pending Requests</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {data.pendingRequests.map((r) => (
            <div key={r.id} className="border rounded p-3 flex justify-between items-center">
              <div>
                <p className="font-medium">{r.employee} ({r.requestNumber})</p>
                <p className="text-sm text-muted-foreground">{r.destination} - {r.date} {r.time}</p>
              </div>
              <Badge variant={r.priority === "high" ? "destructive" : "outline"}>{r.priority}</Badge>
            </div>
          ))}
          {data.pendingRequests.length === 0 && (
            <div className="text-sm text-muted-foreground">No pending requests.</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {data.recentActivity.map((a) => (
            <div key={a.id} className="border rounded p-3">
              <p className="font-medium">{a.action}</p>
              <p className="text-sm text-muted-foreground">{a.employee} - {a.tripId}</p>
            </div>
          ))}
          {data.recentActivity.length === 0 && (
            <div className="text-sm text-muted-foreground">No activity yet.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

