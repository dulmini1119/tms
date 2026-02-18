"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type Approval = {
  id: string;
  requestNumber: string;
  finalStatus: string;
  requestedBy?: { name: string; department: string };
  tripDetails?: { fromLocation: { address: string }; toLocation: { address: string } };
  createdAt: string;
};

export default function HodTripApprovalsPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Approval[]>([]);

  const fetchApprovals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/trip-approvals?page=1&pageSize=50", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch approvals");
      const data = await res.json();
      setRows(data.data || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load approvals");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Trip Approvals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && <div>Loading...</div>}
          {!loading &&
            rows.map((r) => (
              <div key={r.id} className="border rounded p-3 flex justify-between items-center">
                <div>
                  <p className="font-medium">{r.requestNumber}</p>
                  <p className="text-sm text-muted-foreground">
                    {r.requestedBy?.name || "Unknown"} -{" "}
                    {r.tripDetails?.fromLocation?.address || "N/A"} to{" "}
                    {r.tripDetails?.toLocation?.address || "N/A"}
                  </p>
                </div>
                <Badge variant={r.finalStatus === "Approved" ? "default" : r.finalStatus === "Rejected" ? "destructive" : "outline"}>
                  {r.finalStatus}
                </Badge>
              </div>
            ))}
          {!loading && rows.length === 0 && (
            <div className="text-sm text-muted-foreground">No approvals found.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
