"use client";

import React, { useEffect, useState } from "react";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "./dashboard/components/app-sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { Bell } from "lucide-react";
import { NavUser } from "./dashboard/components/nav-user";
import { fetchAPI } from "@/lib/api";

type LayoutUser = {
  name: string;
  role: string;
};

const DEFAULT_ADMIN_USER: LayoutUser = {
  name: "Super Admin",
  role: "SUPERADMIN",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<LayoutUser>(DEFAULT_ADMIN_USER);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const payload = (await fetchAPI("/auth/me")) as {
          data?: { user?: { first_name?: string; last_name?: string; position?: string } };
          user?: { first_name?: string; last_name?: string; position?: string };
        };
        const u = payload?.data?.user || payload?.user;
        if (!u) return;
        const name =
          `${u?.first_name || ""} ${u?.last_name || ""}`.trim() ||
          DEFAULT_ADMIN_USER.name;
        const role = (u?.position || DEFAULT_ADMIN_USER.role)
          .toString()
          .toUpperCase();
        setUser({ name, role });
      } catch {
        // keep fallback
      }
    };

    loadUser();
  }, []);

  return (
    <SidebarProvider>
      <AppSidebar user={user} />

      <SidebarInset className="flex flex-col min-h-screen">
        <header className="flex items-center justify-between h-16 px-4 border-b border-border bg-background">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
          </div>

          <div className="flex items-center gap-4">
            <ModeToggle />

            <button className="relative">
              <Bell className="w-5 h-5 text-muted-foreground hover:text-foreground transition" />
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full" />
            </button>

            <NavUser user={user} />
          </div>
        </header>

        <main className="flex-1 p-2">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
