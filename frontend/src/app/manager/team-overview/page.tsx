"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  teamUtilization: Array<{
    id: string;
    name: string;
    trips: number;
    lastTrip: string | null;
  }>;
};

async function fetchPortal(path: string) {
  const primary = await fetch(path, { credentials: "include" });
  const contentType = primary.headers.get("content-type") || "";
  if (primary.ok && contentType.includes("application/json")) return primary;
  return fetch(`http://localhost:3001${path}`, { credentials: "include" });
}

export default function ManagerTeamOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TeamDashboardData | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchPortal("/portal/team/dashboard");
      if (!res.ok) throw new Error("Failed to fetch team overview");
      setData(await res.json());
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <div className="p-6">Loading team overview...</div>;
  if (!data) return <div className="p-6">No team overview data.</div>;

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Team Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="border rounded p-3"><p className="text-xs text-muted-foreground">Team Members</p><p className="text-xl font-semibold">{data.stats.teamMembers}</p></div>
            <div className="border rounded p-3"><p className="text-xs text-muted-foreground">Pending Approvals</p><p className="text-xl font-semibold">{data.stats.pendingApprovals}</p></div>
            <div className="border rounded p-3"><p className="text-xs text-muted-foreground">Approved This Month</p><p className="text-xl font-semibold">{data.stats.approvedThisMonth}</p></div>
            <div className="border rounded p-3"><p className="text-xs text-muted-foreground">Total Team Trips</p><p className="text-xl font-semibold">{data.stats.totalTeamTrips}</p></div>
          </div>

          <div className="space-y-2">
            {data.teamUtilization.map((member) => (
              <div key={member.id} className="border rounded p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium">{member.name}</p>
                  <p className="text-xs text-muted-foreground">Trips: {member.trips}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Last trip: {member.lastTrip ? new Date(member.lastTrip).toISOString().split("T")[0] : "N/A"}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
