import DashboardPage from "./client-page";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getRecentActivity } from "./recent-activity.action";
import { cache } from "react";
import { User } from "@/lib/types";
import { cached_getById, computeNavItems } from "./layout";

const cachedRecentActivity = cache(getRecentActivity);
export default async function Page() {
  const session = await auth();
  if (!session?.user?.id) {
    return redirect("/signin");
  }
  const user = (await cached_getById("user", session.user.id)) as User;
  if (!user) {
    return redirect("/signin");
  }
  const navItems = computeNavItems(user);
  const recentActivity = await cachedRecentActivity();
  return (
    <DashboardPage
      session={session}
      recentActivity={recentActivity}
      navItems={navItems}
    />
  );
}
