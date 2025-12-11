"use client";

import * as React from "react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import Image from "next/image";

export function TeamSwitcher() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="flex flex-col items-center gap-1 rounded-lg px-3 py-4 cursor-default h-auto"
        >
          {/* Logo */}
          <div className="flex items-center justify-center rounded-lg">
            <Image src="/logo.png" alt="logo" width={50} height={50} />
          </div>

          {/* Text */}
          <span className="font-medium text-sm text-center">
            Transport Management System
          </span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
