"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";

const tripRequestsData = [
  { month: "Jan", requests: 45, completed: 42 },
  { month: "Feb", requests: 52, completed: 48 },
  { month: "Mar", requests: 61, completed: 58 },
  { month: "Apr", requests: 58, completed: 55 },
  { month: "May", requests: 67, completed: 63 },
  { month: "Jun", requests: 71, completed: 68 },
];

export default function TripRequestsChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Trip Requests Over Time</CardTitle>
        <CardDescription>Monthly trip requests and completion rates</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={tripRequestsData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="requests" stroke="#8884d8" strokeWidth={2} name="Requests" />
            <Line type="monotone" dataKey="completed" stroke="#82ca9d" strokeWidth={2} name="Completed" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
