import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Briefcase,
  Search,
  Settings,
  ArrowUpToLine,
  Printer,
  HomeIcon,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { getById } from "@/lib/airtable";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { User } from "@/lib/types";
import { OnboardingWrapper } from "./onboarding";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export const cached_getById = cache(getById);

export type NavItem = {
  href: string;
  title: string;
  icon: React.ReactNode;
  color: string;
};

export const computeNavItems = (user: User) => {
  return [
    {
      href: "/dashboard",
      title: "Dashboard",
      icon: <HomeIcon className="w-5 h-5" />,
      color: "bg-black",
    },
    ...(user?.printer_has
      ? [
          {
            href: "/dashboard/prints",
            title: "Your Prints",
            icon: <Printer className="w-5 h-5" />,
            color: "bg-green-500",
          },
        ]
      : []),
    ...(!user?.printer_has || user?.has_ever_submitted
      ? [
          {
            href: "/dashboard/submissions",
            title: "Your Submissions",
            icon: <Briefcase className="w-5 h-5" />,
            color: "bg-purple-500",
          },
        ]
      : []),

    {
      href: "/dashboard/jobs/search",
      title: "Search Prints",
      icon: <Search className="w-5 h-5" />,
      color: "bg-red-500",
    },
    ...(!user?.printer_has
      ? [
          {
            href: "/dashboard/jobs/create",
            title: "Submit Job",
            icon: <ArrowUpToLine className="w-5 h-5" />,
            color: "bg-orange-500",
          },
        ]
      : []),
    {
      href: "/dashboard/settings",
      title: "Settings",
      icon: <Settings className="w-5 h-5" />,
      color: "bg-blue-500",
    },
  ] satisfies NavItem[];
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }
  const user = (await cached_getById("user", session.user.id)) as User;
  if (!user) {
    redirect("/");
  }
  const navItems = computeNavItems(user);
  return (
    <OnboardingWrapper user={user}>
      <SidebarProvider defaultOpen>
        <div className="flex min-h-screen bg-black w-full" data-theme="dark">
          <DashboardSidebar navItems={navItems} />
          <main className="flex-1 rounded-xl bg-black w-full">
            
            <div className="flex items-center border-b p-1 h-[2.55rem]">
              <SidebarTrigger />
              {/* todo: figure out what to put here in the future lol but calm for now */}
            </div>
            <div className="p-3 sm:p-6">
              {children}
            </div>
          </main>
        </div>
      </SidebarProvider>
    </OnboardingWrapper>
  );
}
