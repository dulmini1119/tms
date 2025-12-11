"use client";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import { Bell } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";

import { HodUser } from "./components/hod-user";
import { HodApp } from "./components/hod-sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = {
    id: "1",
    name: "Sarah Wilson",
    role: "HoD",
    department: "Sales & MArketing",
  };

  return (
    <SidebarProvider>
      <HodApp />
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

            <HodUser user={user} />
          </div>
        </header>

        <main className="flex-1 p-2">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
