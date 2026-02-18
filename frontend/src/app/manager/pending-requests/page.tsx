"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type ApprovalRow = {
  approvalId: string;
  requestNumber: string;
  employee: string;
  employeeId: string;
  department: string;
  destination: string;
  fromLocation: string;
  date: string;
  time: string;
  returnTime: string;
  purpose: string;
  priority: string;
  approverRole: string;
  estimatedCost: number;
  currency: string;
};

type ApprovalQueueResponse = {
  notifications: { unreadCount: number };
  approvals: ApprovalRow[];
};

async function fetchPortal(path: string, options?: RequestInit) {
  const primary = await fetch(path, { credentials: "include", ...options });
  const contentType = primary.headers.get("content-type") || "";
  if (primary.ok && contentType.includes("application/json")) return primary;
  return fetch(`http://localhost:3001${path}`, { credentials: "include", ...options });
}

export default function PendingRequestsPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ApprovalRow[]>([]);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<ApprovalRow | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchPortal("/portal/team/approvals");
      if (!res.ok) throw new Error("Failed to fetch pending requests");
      const data: ApprovalQueueResponse = await res.json();
      setRows(data.approvals || []);
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

  const submitAction = async (approvalId: string, action: "Approved" | "Rejected", comments = "") => {
    setSubmittingId(approvalId);
    try {
      const res = await fetchPortal(`/portal/team/approvals/${approvalId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, comments }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.message || `Failed to ${action.toLowerCase()}`);
      }
      toast.success(`Request ${action.toLowerCase()} successfully`);
      setSelected(null);
      setRejectReason("");
      await fetchData();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Action failed");
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Pending Trip Requests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && <div>Loading...</div>}
          {!loading && rows.length === 0 && (
            <div className="text-sm text-muted-foreground">No pending requests assigned to you.</div>
          )}
          {!loading &&
            rows.map((r) => (
              <div key={r.approvalId} className="border rounded p-3">
                <div className="flex justify-between items-center">
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
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setSelected(r)}>
                    View Details
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => submitAction(r.approvalId, "Approved")}
                    disabled={submittingId === r.approvalId}
                  >
                    Quick Approve
                  </Button>
                </div>
              </div>
            ))}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Trip Request Details</DialogTitle>
          </DialogHeader>

          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><strong>Request:</strong> {selected.requestNumber}</div>
                <div><strong>Priority:</strong> {selected.priority}</div>
                <div><strong>Employee:</strong> {selected.employee}</div>
                <div><strong>Employee ID:</strong> {selected.employeeId || 'N/A'}</div>
                <div><strong>Department:</strong> {selected.department}</div>
                <div><strong>Approver Role:</strong> {selected.approverRole}</div>
                <div><strong>Date:</strong> {selected.date}</div>
                <div><strong>Time:</strong> {selected.time} - {selected.returnTime || 'N/A'}</div>
              </div>

              <div className="text-sm"><strong>Route:</strong> {selected.fromLocation} to {selected.destination}</div>
              <div className="text-sm"><strong>Purpose:</strong> {selected.purpose}</div>
              <div className="text-sm"><strong>Estimated Cost:</strong> {selected.currency} {selected.estimatedCost || 0}</div>

              <div>
                <label className="text-sm font-medium">Reason (required for rejection)</label>
                <Textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Enter rejection reason..."
                  className="mt-1"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => submitAction(selected.approvalId, "Approved")}
                  disabled={submittingId === selected.approvalId}
                >
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => submitAction(selected.approvalId, "Rejected", rejectReason)}
                  disabled={submittingId === selected.approvalId || !rejectReason.trim()}
                >
                  Reject with Reason
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
