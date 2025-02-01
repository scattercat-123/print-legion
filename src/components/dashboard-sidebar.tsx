"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/app/dashboard/layout";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { PrinterIcon } from "lucide-react";
import { cn } from "@/lib/utils";
interface DashboardSidebarProps {
  navItems: NavItem[];
}

const SidebarHead = () => {
  const { open } = useSidebar();
  return (
    <div
      className={cn(
        "flex w-full h-full items-center ",
        !open ? "justify-center" : "justify-start"
      )}
    >
      <PrinterIcon className={cn("w-5 h-5 shrink-0", open && "mr-2")} />
      {open && (
        <span className="font-medium tracking-tight">./print_legion</span>
      )}
    </div>
  );
};

export function DashboardSidebar({ navItems }: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b h-[2.55rem]">
        <SidebarHead />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.slice(0, -1).map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      {item.icon}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname === navItems[navItems.length - 1].href}
              tooltip={navItems[navItems.length - 1].title}
            >
              <Link href={navItems[navItems.length - 1].href}>
                {navItems[navItems.length - 1].icon}
                <span>{navItems[navItems.length - 1].title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
