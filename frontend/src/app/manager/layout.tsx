"use client";

import React, { useEffect, useState } from "react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import { Bell } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { MngApp } from "./components/mng-sidebar";
import { MngUser } from "./components/mng-user";

type LayoutUser = {
  name: string;
  role: string;
};

async function fetchPortal(path: string) {
  const primary = await fetch(path, { credentials: "include" });
  const contentType = primary.headers.get("content-type") || "";
  if (primary.ok && contentType.includes("application/json")) return primary;
  return fetch(`http://localhost:3001${path}`, { credentials: "include" });
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<LayoutUser>({
    name: "Manager User",
    role: "MANAGER",
  });
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const [dashboardRes, notifRes] = await Promise.all([
          fetchPortal("/portal/team/dashboard"),
          fetchPortal("/portal/team/approvals/notifications"),
        ]);

        if (dashboardRes.ok) {
          const dashboard = await dashboardRes.json();
          setUser({
            name: dashboard?.user?.name || "Manager User",
            role: dashboard?.user?.role || "MANAGER",
          });
        }

        if (notifRes.ok) {
          const notif = await notifRes.json();
          setNotificationCount(Number(notif?.unreadCount || 0));
        }
      } catch {
        // keep defaults
      }
    };

    load();
  }, []);

  return (
    <SidebarProvider>
      <MngApp user={user} />
      <SidebarInset className="flex flex-col min-h-screen">
        <header className="flex items-center justify-between h-16 px-4 border-b border-border bg-background">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
          </div>

          <div className="flex items-center gap-4">
            <ModeToggle />

            <button className="relative">
              <Bell className="w-5 h-5 text-muted-foreground hover:text-foreground transition" />
              {notificationCount > 0 && (
                <span className="absolute -top-2 -right-2 min-w-4 h-4 px-1 text-[10px] bg-red-500 text-white rounded-full flex items-center justify-center">
                  {notificationCount > 9 ? "9+" : notificationCount}
                </span>
              )}
            </button>

            <MngUser user={user} />
          </div>
        </header>

        <main className="flex-1 p-2">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
