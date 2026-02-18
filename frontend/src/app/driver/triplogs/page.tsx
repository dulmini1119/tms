"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type TripLogItem = {
  id: string;
  tripNumber: string;
  date: string;
  status: string;
  employee: string;
  fromLocation: string;
  destination: string;
  actualDistance: number;
  fuelConsumed: number;
  remarks: string;
  rating: number;
  vehicle: string;
  purpose: string;
};

const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, "0")}`;
};

export default function DriverTripLogsPage() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<TripLogItem[]>([]);
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState(currentMonth());

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/portal/driver/trip-logs?month=${month}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch logs");
      const data: TripLogItem[] = await res.json();
      setLogs(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load trip logs");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return logs;
    return logs.filter(
      (l) =>
        l.tripNumber.toLowerCase().includes(q) ||
        l.employee.toLowerCase().includes(q) ||
        l.destination.toLowerCase().includes(q) ||
        l.purpose.toLowerCase().includes(q),
    );
  }, [logs, search]);

  const exportCsv = () => {
    const csv = [
      ["Trip", "Date", "Employee", "From", "To", "Status", "Distance", "Fuel", "Rating"],
      ...filtered.map((l) => [
        l.tripNumber,
        l.date,
        l.employee,
        l.fromLocation,
        l.destination,
        l.status,
        String(l.actualDistance),
        String(l.fuelConsumed),
        String(l.rating),
      ]),
    ]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `driver_trip_logs_${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Trip Logs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Input
              className="max-w-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search logs..."
            />
            <Input
              type="month"
              className="w-[180px]"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
            <Button variant="outline" onClick={exportCsv}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          {loading ? (
            <div>Loading logs...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trip</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Distance</TableHead>
                  <TableHead>Rating</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.tripNumber}</TableCell>
                    <TableCell>{log.date}</TableCell>
                    <TableCell>{log.employee}</TableCell>
                    <TableCell>
                      <div className="text-sm">{log.fromLocation}</div>
                      <div className="text-xs text-muted-foreground">{log.destination}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={/completed/i.test(log.status) ? "secondary" : "outline"}>
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{log.actualDistance} km</TableCell>
                    <TableCell>{log.rating || 0}/5</TableCell>
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
