"use client";

import * as React from "react";
import { Car, CheckSquare, MapPin, Route } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

import { TeamSwitcher } from "@/app/admin/dashboard/components/team-switcher";
import { VAdminMain } from "./vadmin-main";
import { VAdminUser } from "./vadmin-user";

const menuItems = [
  {
    title: "Dashboard",
    icon: MapPin,
    id: "dashboard",
    url:"/vehicleadmin/dashboard"
  },
  {
    title: "Vehicle Assignments",
    icon: Car,
    id: "assignments",
    url:"/vehicleadmin/vehicle-assignments"
  },
  {
    title: "Approved Trips",
    icon: CheckSquare,
    id: "approved-trips",
    url:"/vehicleadmin/approved-trips"
  },
  {
    title: "Fleet Overview",
    icon: Route,
    id: "fleet-overview",
    url:"/vehicleadmin/fleet-overview"
  },
];

const data = {
  user: {
    name: "Sarah Wilson",
    email: "sarah@wilson.com",
    role: "HoD",
  },
};

export function VAdminApp({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>

      <SidebarContent>
        <VAdminMain items={menuItems} />
      </SidebarContent>

      <SidebarFooter className="pb-5">
        <VAdminUser user={data.user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
