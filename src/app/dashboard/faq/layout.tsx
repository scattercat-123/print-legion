import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { cached_getById } from "@/app/dashboard/layout";

export default async function StatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const user = await cached_getById("user", session.user.id);
  if (!user?.printer_has) {
    redirect("/dashboard");
  }

  return <>{children}</>;
} 