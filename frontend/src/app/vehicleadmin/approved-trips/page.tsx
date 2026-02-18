'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Clock, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

type ApprovedTrip = {
  id: string;
  requestNumber: string;
  employee: string;
  employeePhone: string;
  department: string;
  destination: string;
  fromLocation: string;
  date: string;
  time: string;
  returnTime: string;
  purpose: string;
  priority: string;
  vehicleType: string;
  passengers: number;
  estimatedDistance: string;
  status: string;
};

async function fetchPortal(path: string) {
  const primary = await fetch(path, { credentials: 'include' });
  const contentType = primary.headers.get('content-type') || '';
  if (primary.ok && contentType.includes('application/json')) {
    return primary;
  }
  return fetch(`http://localhost:3001${path}`, { credentials: 'include' });
}

export default function ApprovedTrips() {
  const [rows, setRows] = useState<ApprovedTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetchPortal('/portal/vehicle-admin/approved-trips');
        if (!res.ok) throw new Error('Failed to fetch approved trips');
        const payload = await res.json();
        setRows(Array.isArray(payload) ? payload : []);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to fetch approved trips');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return rows;
    return rows.filter((trip) =>
      [trip.requestNumber, trip.employee, trip.department, trip.destination, trip.purpose]
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  }, [rows, search]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>Approved Trips</h1>
        <p className="text-muted-foreground">Trips approved by managers/HODs and waiting for vehicle assignment</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search approved trips..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Approved Trip Queue</CardTitle>
          <CardDescription>{filtered.length} trip(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && <div className="text-sm text-muted-foreground">Loading approved trips...</div>}
          {!loading && error && <div className="text-sm text-red-600">{error}</div>}
          {!loading && !error && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Trip Details</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((trip) => (
                  <TableRow key={trip.id}>
                    <TableCell className="font-medium">{trip.requestNumber}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{trip.employee}</div>
                        <div className="text-sm text-muted-foreground">{trip.department}</div>
                        <div className="text-xs text-muted-foreground">{trip.employeePhone}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{trip.destination}</div>
                        <div className="text-sm text-muted-foreground">From: {trip.fromLocation}</div>
                        <div className="text-sm text-muted-foreground">{trip.purpose}</div>
                        <div className="mt-1 flex gap-1">
                          <Badge variant={getPriorityColor(trip.priority)} className="text-xs">{trip.priority}</Badge>
                          <Badge variant="outline" className="text-xs">{trip.vehicleType}</Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {trip.date}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {trip.time} - {trip.returnTime || 'N/A'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="destructive">{trip.status.replace('-', ' ')}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {!filtered.length && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No approved trips found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
