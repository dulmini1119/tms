"use client"

import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { fetchAPI } from "@/lib/api";

export function NavUser({

  user,
}: {
  user: {
    name: string
    role: string
  }
}) {

  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetchAPI("/auth/logout", { method: "POST" });
    } catch {
      // continue client-side logout
    }
    localStorage.removeItem("auth_token");
    localStorage.removeItem("authToken");
    router.push("/login");
  }

  const displayName = user?.name || "User";
  const displayRole = user?.role || "SUPERADMIN";
  const avatarChar = displayName?.trim()?.[0]?.toUpperCase() || "U";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarFallback className="rounded-lg" suppressHydrationWarning>
                  {avatarChar}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium" suppressHydrationWarning>
                  {displayName}
                </span>
                <span className="truncate text-xs" suppressHydrationWarning>
                  {displayRole}
                </span>
              </div>

               <LogOut
            className="size-4 text-muted-foreground hover:text-foreground cursor-pointer"
            onClick={handleLogout}
          />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
