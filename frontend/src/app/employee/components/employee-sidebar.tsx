"use client";

import * as React from "react";
import {  Route, MapPin } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

import { TeamSwitcher } from "@/app/admin/dashboard/components/team-switcher";
import { EmployeeMain } from "./employee-main";
import { EmployeeUser } from "./emplyee-user";


const menuItems = [
  {
    title: "Dashboard",
    icon: MapPin,
    id: "dashboard",
    url: "/employee/dashboard"
  },
  {
    title: "Trip Requests",
    icon: Route,
    id: "assignments",
     url: "/employee/trip-request"
  },

];

const data = {
  user: {
    name: "Nimal Shreak",
    email: "nimal@shreak.com",
    role: "Employee",
  },
};

export function EmployeeApp({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>

      <SidebarContent>
        <EmployeeMain items={menuItems} />
      </SidebarContent>

      <SidebarFooter className="pb-5">
        <EmployeeUser user={data.user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
