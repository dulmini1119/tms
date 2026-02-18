"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type PendingRequest = {
  id: string;
  requestNumber: string;
  employee: string;
  destination: string;
  date: string;
  time: string;
  purpose: string;
  priority: string;
};

export default function PendingRequestsPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<PendingRequest[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/portal/team/dashboard", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch pending requests");
      const data = await res.json();
      setRows(data.pendingRequests || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load pending requests");
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
          <CardTitle>Pending Trip Requests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && <div>Loading...</div>}
          {!loading && rows.length === 0 && (
            <div className="text-sm text-muted-foreground">No pending requests.</div>
          )}
          {!loading &&
            rows.map((r) => (
              <div key={r.id} className="border rounded p-3 flex justify-between items-center">
                <div>
                  <p className="font-medium">{r.employee} ({r.requestNumber})</p>
                  <p className="text-sm text-muted-foreground">
                    {r.destination} - {r.date} {r.time}
                  </p>
                  <p className="text-xs text-muted-foreground">{r.purpose}</p>
                </div>
                <Badge variant={r.priority === "high" ? "destructive" : "outline"}>
                  {r.priority}
                </Badge>
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
