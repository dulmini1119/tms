"use client";

import React, { useEffect, useState } from "react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import { Bell } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { VAdminApp } from "./components/vadmin-sidebar";
import { VAdminUser } from "./components/vadmin-user";

type LayoutUser = {
  id: string;
  name: string;
  role: string;
  department: string;
};

async function fetchPortal(path: string) {
  const primary = await fetch(path, { credentials: "include" });
  const contentType = primary.headers.get("content-type") || "";
  if (primary.ok && contentType.includes("application/json")) {
    return primary;
  }
  return fetch(`http://localhost:3001${path}`, { credentials: "include" });
}

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<LayoutUser>({
    id: "1",
    name: "Vehicle Admin",
    role: "VEHICLE_ADMIN",
    department: "Transport",
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetchPortal("/portal/vehicle-admin/profile");
        if (!res.ok) return;
        const payload = await res.json();
        const info = payload?.personalInfo;
        if (!info) return;

        setUser((prev) => ({
          ...prev,
          name: info.name || prev.name,
          role: "VEHICLE_ADMIN",
          department: info.department || prev.department,
        }));
      } catch {
        // Keep fallback user if profile is unavailable.
      }
    };

    loadUser();
  }, []);

  return (
    <SidebarProvider>
      <VAdminApp user={{ name: user.name, role: user.role }} />
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

            <VAdminUser user={{ name: user.name, role: user.role }} />
          </div>
        </header>

        <main className="flex-1 p-2">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
