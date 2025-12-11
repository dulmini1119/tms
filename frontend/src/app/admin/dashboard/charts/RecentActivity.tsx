"use client";
import { Card, CardHeader, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const recentActivity = [
  { id: 1, action: "Trip Completed", user: "John Smith", details: "Mumbai to Pune trip completed successfully", time: "10 minutes ago" },
  { id: 2, action: "Vehicle Added", user: "Admin", details: "New Honda City added to fleet", time: "2 hours ago" },
  { id: 3, action: "Driver Assigned", user: "Sarah Johnson", details: "Driver assigned to trip TR-001", time: "4 hours ago" },
  { id: 4, action: "Document Uploaded", user: "Mike Wilson", details: "Insurance document uploaded for MH-12-AB-5678", time: "6 hours ago" },
];

export default function RecentActivity() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest actions in the system</CardDescription>
        </div>
        <Button variant="outline" size="sm">View All</Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {recentActivity.map(activity => (
          <div key={activity.id} className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="h-2 w-2 bg-primary rounded-full mt-2"></div>
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <p className="font-medium">{activity.action}</p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
              <p className="text-sm text-muted-foreground">by {activity.user}</p>
              <p className="text-sm">{activity.details}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
