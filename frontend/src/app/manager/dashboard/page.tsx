"use client";
import React from "react";
import {
  CheckSquare,
  Clock,
  Users,
  Car,
  TrendingUp,
  AlertTriangle,
  Calendar,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// ✅ Define type first
interface UserRole {
  id: string;
  name: string;
  role: string;
  department: string;
  businessUnit: string;
}


const user: UserRole = {
  id: "1",
  name: "David Goe",
  role: "Manger",
  department: "Marketing & Sales",
  businessUnit: "Sales",
};


const mockStats = {
  pendingApprovals: 8,
  totalTeamTrips: 35,
  approvedThisMonth: 42,
  teamMembers: (user: UserRole) => (user.role === "manager" ? 45 : 12),
};

const mockPendingRequests = [
  {
    id: "TR001",
    employee: "John Smith",
    department: "Marketing",
    destination: "Downtown Office",
    date: "2024-01-16",
    time: "09:00 AM",
    purpose: "Client Meeting",
    priority: "high",
    submittedAt: "2024-01-15 14:30",
  },
  {
    id: "TR002",
    employee: "Lisa Chen",
    department: "Marketing",
    destination: "Airport",
    date: "2024-01-17",
    time: "02:30 PM",
    purpose: "Business Travel",
    priority: "medium",
    submittedAt: "2024-01-15 16:45",
  },
  {
    id: "TR003",
    employee: "David Brown",
    department: "IT",
    destination: "Client Office - Whitefield",
    date: "2024-01-18",
    time: "11:00 AM",
    purpose: "Project Discussion",
    priority: "medium",
    submittedAt: "2024-01-16 09:15",
  },
];

const mockRecentActivity = [
  {
    id: "ACT001",
    action: "Approved trip request",
    employee: "Sarah Wilson",
    tripId: "TR004",
    timestamp: "2 hours ago",
  },
  {
    id: "ACT002",
    action: "Rejected trip request",
    employee: "Mike Johnson",
    tripId: "TR005",
    timestamp: "4 hours ago",
  },
  {
    id: "ACT003",
    action: "Approved trip request",
    employee: "Emma Davis",
    tripId: "TR006",
    timestamp: "1 day ago",
  },
];

const mockTeamUtilization = [
  { name: "John Smith", trips: 8, lastTrip: "2024-01-14" },
  { name: "Lisa Chen", trips: 12, lastTrip: "2024-01-15" },
  { name: "David Brown", trips: 6, lastTrip: "2024-01-13" },
  { name: "Sarah Wilson", trips: 15, lastTrip: "2024-01-16" },
];

export default function ManagerDashboard() {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const isManager = user.role === "manager";
  const scopeText = isManager ? user.businessUnit : user.department;

  return (
    <div className="space-y-4">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div className="p-3">
          <h1 className="text-2xl">Welcome, {user.name}!</h1>
          <p className="text-muted-foreground text-xs">
            {isManager ? "Head of Department" : "Department Manager"} • {scopeText}
          </p>
        </div>
        <Button className="gap-2">
          <CheckSquare className="h-4 w-4" />
          Review Approvals
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Approvals
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {mockStats.pendingApprovals}
            </div>
            <p className="text-xs text-muted-foreground">
              Requires your attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockStats.teamMembers(user)}
            </div>
            <p className="text-xs text-muted-foreground">
              Under your supervision
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockStats.approvedThisMonth}
            </div>
            <p className="text-xs text-muted-foreground">Trips approved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Trips</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.totalTeamTrips}</div>
            <p className="text-xs text-muted-foreground">
              Team trips this month
            </p>
          </CardContent>
        </Card>
      </div>

<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approvals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Pending Trip Approvals
            </CardTitle>
            <CardDescription>Requests awaiting your approval</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockPendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{request.employee}</span>
                      <Badge
                        variant={getPriorityColor(request.priority)}
                        className="text-xs"
                      >
                        {request.priority}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {request.department} • {request.purpose}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3 inline mr-1" />
                      {request.destination}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3 inline mr-1" />
                      {request.date} at {request.time}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-600"
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600"
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
              <div className="text-center pt-2">
                <Button variant="outline" className="w-full">
                  View All Pending Requests
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your recent approval actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockRecentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="font-medium">{activity.action}</div>
                    <div className="text-sm text-muted-foreground">
                      Employee: {activity.employee} • Trip: {activity.tripId}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {activity.timestamp}
                    </div>
                  </div>
                  <Badge
                    variant={
                      activity.action.includes("Approved")
                        ? "default"
                        : "outline"
                    }
                  >
                    {activity.action.includes("Approved")
                      ? "Approved"
                      : "Rejected"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Utilization */}
      <Card>
        <CardHeader>
          <CardTitle>Team Trip Utilization</CardTitle>
          <CardDescription>
            Overview of trip usage by your team members this month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockTeamUtilization.map((member, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium">{member.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Last trip: {member.lastTrip}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold">{member.trips}</div>
                  <div className="text-sm text-muted-foreground">trips</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
