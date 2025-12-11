"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { ChevronRight, type LucideIcon } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

type MenuItem = {
  title: string;
  id: string;
  url?: string;
  icon?: LucideIcon;
  children?: MenuItem[];
};

export function VAdminMain({ items }: { items: MenuItem[] }) {
  const pathname = usePathname();

  // helper to check if current item (or its child) is active
  const isActive = (item: MenuItem) => {
    if (item.url && pathname === item.url) return true;
    if (item.children) return item.children.some((child) => child.url === pathname);
    return false;
  };

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => {
          const active = isActive(item);

          // if item has children -> collapsible
          if (item.children) {
            return (
              <Collapsible
                key={item.id}
                asChild
                defaultOpen={active}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip={item.title}
                      className={active ? "bg-accent text-accent-foreground" : ""}
                    >
                      {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                      <span>{item.title}</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.children.map((subItem) => {
                        const subActive = isActive(subItem);
                        return (
                          <SidebarMenuSubItem key={subItem.id}>
                            <SidebarMenuSubButton asChild>
                              <a
                                href={subItem.url ?? "#"}
                                className={subActive ? "bg-accent text-accent-foreground" : ""}
                              >
                                {subItem.icon && (
                                  <subItem.icon className="mr-2 h-4 w-4" />
                                )}
                                {subItem.title}
                              </a>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            );
          }

          // item without children -> simple link
          return (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton asChild className={active ? "bg-accent text-accent-foreground" : ""}>
                <a href={item.url ?? "#"}>
                  {item.icon && <item.icon className="mr-2 h-4 w-4" />}
                  {item.title}
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
