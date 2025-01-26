import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
    <div className="flex h-screen overflow-hidden bg-black">
      {/* Sidebar */}
      <div className="w-64 border-r border-zinc-800">
        <div className="flex flex-col h-full justify-between py-4">
          {/* Top section with main tabs */}
          <div className="px-3 py-2">
            <div className="space-y-1">
              {navItems.slice(0, -1).map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-2 font-normal",
                      "text-zinc-400 hover:text-zinc-50 hover:bg-zinc-900"
                    )}
                  >
                    {item.icon}
                    {item.title}
                  </Button>
                </Link>
              ))}
            </div>
          </div>

          {/* Bottom section with settings */}
          <div className="px-3 py-2">
            <Link href={navItems[navItems.length - 1].href}>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 font-normal text-zinc-400 hover:text-zinc-50 hover:bg-zinc-900"
              >
                {navItems[navItems.length - 1].icon}
                {navItems[navItems.length - 1].title}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <main className="flex-1 overflow-y-auto p-8 text-zinc-200">
        {children}
      </main>
    </div>
  );
}
