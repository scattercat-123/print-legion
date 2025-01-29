import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import CreateJobPage from "./client-page";
import { cached_getById } from "../../layout";

export default async function SettingsLayout() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const settingsData = await cached_getById("user", session.user.id);
  if (!settingsData) redirect("/");
  return <CreateJobPage settingsData={settingsData} />;
}
