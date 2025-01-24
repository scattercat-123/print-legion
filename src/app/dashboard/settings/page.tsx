import { getById } from "@/lib/airtable";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import SettingsPage from "./client-page";

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const settingsData = await getById("user", session.user.id);
  if (!settingsData) redirect("/");
  return <SettingsPage settingsData={settingsData} />;
}
