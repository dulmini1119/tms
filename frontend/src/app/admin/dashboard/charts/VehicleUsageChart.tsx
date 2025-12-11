"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";

const vehicleUsageData = [
  { vehicle: "Sedan", hours: 120 },
  { vehicle: "SUV", hours: 98 },
  { vehicle: "Hatchback", hours: 87 },
  { vehicle: "Van", hours: 65 },
  { vehicle: "Truck", hours: 43 },
];

export default function VehicleUsageChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vehicle Usage</CardTitle>
        <CardDescription>Hours of usage by vehicle type</CardDescription>
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
  );
}
