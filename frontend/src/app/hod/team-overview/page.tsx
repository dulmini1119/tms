"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

type TeamMember = {
  id: string;
  name: string;
  trips: number;
  lastTrip: string | null;
};

export default function TeamOverviewPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<TeamMember[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/portal/team/dashboard", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch team overview");
      const data = await res.json();
      setRows(data.teamUtilization || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load team overview");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Team Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && <div>Loading...</div>}
          {!loading &&
            rows.map((r) => (
              <div key={r.id} className="border rounded p-3 flex justify-between">
                <span>{r.name}</span>
                <span className="text-sm text-muted-foreground">
                  {r.trips} trips {r.lastTrip ? `• Last: ${new Date(r.lastTrip).toISOString().split("T")[0]}` : ""}
                </span>
              </div>
            ))}
          {!loading && rows.length === 0 && (
            <div className="text-sm text-muted-foreground">No team data found.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
