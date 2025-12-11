"use client";
import { AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { Card, CardHeader, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const alerts = [
  { id: 1, type: "warning", title: "License Expiring", description: "Vehicle MH-12-AB-1234 license expires in 5 days", time: "2 hours ago" },
  { id: 2, type: "error", title: "Insurance Expired", description: "Driver John Doe's insurance has expired", time: "4 hours ago" },
  { id: 3, type: "info", title: "Pending Approval", description: "Trip request from Marketing Dept needs approval", time: "6 hours ago" },
];

export default function AlertsPanel() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>System Alerts</CardTitle>
          <CardDescription>Important notifications requiring attention</CardDescription>
        </div>
        <Button variant="outline" size="sm">View All</Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {alerts.map(alert => (
          <div key={alert.id} className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              {alert.type === "error" && <AlertTriangle className="h-5 w-5 text-red-500" />}
              {alert.type === "warning" && <Clock className="h-5 w-5 text-yellow-500" />}
              {alert.type === "info" && <CheckCircle className="h-5 w-5 text-blue-500" />}
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <p className="font-medium">{alert.title}</p>
                <Badge
                  variant={alert.type === "error" ? "destructive" :
                           alert.type === "warning" ? "secondary" : "default"}
                  className="text-xs"
                >
                  {alert.type}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{alert.description}</p>
              <p className="text-xs text-muted-foreground">{alert.time}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
