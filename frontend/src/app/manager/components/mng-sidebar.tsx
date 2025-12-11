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


import { MngUser } from "./mng-user";
import { MngMain } from "./mng-main";



const menuItems = [
  {
    title: "Dashboard",
    icon: BarChart3,
    id: "dashboard",
    url:"/manager/dashboard"
  },
  {
    title: "Trip Approvals",
    icon: CheckSquare,
    id: "approvals",
    url:"/manager/trip-approvals"
  },
  {
    title: "Pending Requests",
    icon: Clock,
    id: "pending-requests",
    url:"/manager/pending-requests"
  },
  {
    title: "Team Overview",
    icon: Users,
    id: "team-overview",
    url:"/manager/team-overview"
  }
];

const data = {
  user: {
    name: "Sarah Wilson",
    email: "sarah@wilson.com",
    role: "HoD",
  },
};

export function MngApp({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>

      <SidebarContent>
        <MngMain items={menuItems} />
      </SidebarContent>

      <SidebarFooter className="pb-5">
        <MngUser user={data.user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
