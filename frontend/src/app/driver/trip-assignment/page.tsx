"use client";

import { useCallback, useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type DriverAssignment = {
  id: string;
  requestNumber: string;
  employee: string;
  employeePhone?: string;
  department: string;
  destination: string;
  fromLocation: string;
  date: string;
  scheduledTime: string;
  returnTime: string;
  purpose: string;
  status: "scheduled" | "active" | "completed";
  distance: string;
};

export default function DriverTripAssignmentsPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<DriverAssignment[]>([]);

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/portal/driver/assignments?viewMode=all", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch assignments");
      const data: DriverAssignment[] = await res.json();
      setRows(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load assignments");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const act = async (id: string, action: "start" | "end") => {
    try {
      const res = await fetch(`/portal/driver/assignments/${id}/${action}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error(`Failed to ${action}`);
      toast.success(action === "start" ? "Trip started" : "Trip completed");
      fetchAssignments();
    } catch (error) {
      console.error(error);
      toast.error(`Could not ${action} trip`);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Trip Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading assignments...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Date/Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="font-medium">{r.requestNumber}</div>
                      <div className="text-xs text-muted-foreground">{r.purpose}</div>
                    </TableCell>
                    <TableCell>
                      <div>{r.employee}</div>
                      <div className="text-xs text-muted-foreground">{r.department}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">From: {r.fromLocation}</div>
                      <div className="text-sm">To: {r.destination}</div>
                      <div className="text-xs text-muted-foreground">{r.distance}</div>
                    </TableCell>
                    <TableCell>
                      <div>{r.date}</div>
                      <div className="text-xs text-muted-foreground">
                        {r.scheduledTime} - {r.returnTime || "--:--"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          r.status === "active"
                            ? "default"
                            : r.status === "completed"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {r.status === "scheduled" && (
                          <Button size="sm" onClick={() => act(r.id, "start")}>
                            Start
                          </Button>
                        )}
                        {r.status === "active" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => act(r.id, "end")}
                          >
                            End
                          </Button>
                        )}
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

