"use client"
import React from 'react';

import { 
  Users, 
  Car, 
  Route, 
  FileCheck, 
  AlertTriangle, 
  Clock,
  CheckCircle,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const statsData = [
  {
    title: "Total Users",
    value: "1,247",
    change: "+12%",
    icon: Users,
    trend: "up"
  },
  {
    title: "Total Vehicles",
    value: "89",
    change: "+3%",
    icon: Car,
    trend: "up"
  },
  {
    title: "Active Trips",
    value: "23",
    change: "-5%",
    icon: Route,
    trend: "down"
  },
  {
    title: "Pending Approvals",
    value: "7",
    change: "+2",
    icon: FileCheck,
    trend: "up"
  }
];

const tripRequestsData = [
  { month: 'Jan', requests: 45, completed: 42 },
  { month: 'Feb', requests: 52, completed: 48 },
  { month: 'Mar', requests: 61, completed: 58 },
  { month: 'Apr', requests: 58, completed: 55 },
  { month: 'May', requests: 67, completed: 63 },
  { month: 'Jun', requests: 71, completed: 68 }
];

const vehicleUsageData = [
  { vehicle: 'Sedan', hours: 120 },
  { vehicle: 'SUV', hours: 98 },
  { vehicle: 'Hatchback', hours: 87 },
  { vehicle: 'Van', hours: 65 },
  { vehicle: 'Truck', hours: 43 }
];

const alerts = [
  {
    id: 1,
    type: "warning",
    title: "License Expiring",
    description: "Vehicle MH-12-AB-1234 license expires in 5 days",
    time: "2 hours ago"
  },
  {
    id: 2,
    type: "error",
    title: "Insurance Expired",
    description: "Driver John Doe's insurance has expired",
    time: "4 hours ago"
  },
  {
    id: 3,
    type: "info",
    title: "Pending Approval",
    description: "Trip request from Marketing Dept needs approval",
    time: "6 hours ago"
  }
];

const recentActivity = [
  {
    id: 1,
    action: "Trip Completed",
    user: "John Smith",
    details: "Mumbai to Pune trip completed successfully",
    time: "10 minutes ago"
  },
  {
    id: 2,
    action: "Vehicle Added",
    user: "Admin",
    details: "New Honda City added to fleet",
    time: "2 hours ago"
  },
  {
    id: 3,
    action: "Driver Assigned",
    user: "Sarah Johnson",
    details: "Driver assigned to trip TR-001",
    time: "4 hours ago"
  },
  {
    id: 4,
    action: "Document Uploaded",
    user: "Mike Wilson",
    details: "Insurance document uploaded for MH-12-AB-5678",
    time: "6 hours ago"
  }
];

export default function Dashboard() {
  return (
    <div className="space-y-4">
      <div className='p-3'>
        <h1 className='text-2xl'>DASHBOARD</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className={stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                  {stat.change}
                </span>{' '}
                from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Trip Requests Chart */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Trip Requests Over Time</CardTitle>
            <CardDescription>
              Monthly trip requests and completion rates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={tripRequestsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="requests" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="Requests"
                />
                <Line 
                  type="monotone" 
                  dataKey="completed" 
                  stroke="#82ca9d" 
                  strokeWidth={2}
                  name="Completed"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Vehicle Usage Chart */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Vehicle Usage</CardTitle>
            <CardDescription>
              Hours of usage by vehicle type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={vehicleUsageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="vehicle" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="hours" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Alerts Panel */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>System Alerts</CardTitle>
              <CardDescription>
                Important notifications requiring attention
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-start space-x-3">
                <div className="shrink-0">
                  {alert.type === 'error' && (
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  )}
                  {alert.type === 'warning' && (
                    <Clock className="h-5 w-5 text-yellow-500" />
                  )}
                  {alert.type === 'info' && (
                    <CheckCircle className="h-5 w-5 text-blue-500" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{alert.title}</p>
                    <Badge
                      variant={alert.type === 'error' ? 'destructive' : 
                              alert.type === 'warning' ? 'secondary' : 'default'}
                      className="text-xs"
                    >
                      {alert.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {alert.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {alert.time}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest actions in the system
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="shrink-0">
                  <div className="h-2 w-2 bg-primary rounded-full mt-2"></div>
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.time}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    by {activity.user}
                  </p>
                  <p className="text-sm">
                    {activity.details}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}