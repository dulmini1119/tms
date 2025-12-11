"use client";

import * as React from "react";
import {  BarChart3, CheckSquare, Clock, Users } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

import { TeamSwitcher } from "@/app/admin/dashboard/components/team-switcher";
import { HodUser } from "./hod-user";
import { HodMain } from "./hod-main";



const menuItems = [
  {
    title: "Dashboard",
    icon: BarChart3,
    id: "dashboard",
    url:"/hod/dashboard"
  },
  {
    title: "Trip Approvals",
    icon: CheckSquare,
    id: "approvals",
    url:"/hod/trip-approvals"
  },
  {
    title: "Pending Requests",
    icon: Clock,
    id: "pending-requests",
    url:"/hod/pending-requests"
  },
  {
    title: "Team Overview",
    icon: Users,
    id: "team-overview",
    url:"/hod/team-overview"
  }
];

const data = {
  user: {
    name: "Sarah Wilson",
    email: "sarah@wilson.com",
    role: "HoD",
  },
};

export function HodApp({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>

      <SidebarContent>
        <HodMain items={menuItems} />
      </SidebarContent>

      <SidebarFooter className="pb-5">
        <HodUser user={data.user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
