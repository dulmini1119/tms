"use client";

import * as React from "react";
import { Car, Route, MapPin } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

import { TeamSwitcher } from "@/app/admin/dashboard/components/team-switcher";
import { DriverMain } from "./driver-main";
import { DriverUser } from "./driver-user";

const menuItems = [
  {
    title: "Dashboard",
    icon: MapPin,
    id: "dashboard",
    url: "/driver/dashboard"
  },
  {
    title: "Trip Assignments",
    icon: Route,
    id: "assignments",
     url: "/driver/trip-assignment"
  },
  {
    title: "My Profile",
    icon: Car,
    id: "profile",
     url: "/driver/profile"
  },
];

const data = {
  user: {
    name: "Mike Wotson",
    email: "mike@wotson.com",
    role: "Driver",
  },
};

export function DriverApp({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>

      <SidebarContent>
        <DriverMain items={menuItems} />
      </SidebarContent>

      <SidebarFooter className="pb-5">
        <DriverUser user={data.user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
