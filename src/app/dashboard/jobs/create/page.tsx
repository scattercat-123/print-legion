import CreateJobPage from "./client-page";

export default async function SettingsLayout() {
  // const session = await auth();
  // if (!session?.user?.id) {
  //   redirect("/");
  // }

  // const settingsData = await cached_getById("user", session.user.id);
  // if (!settingsData) redirect("/");
  return <CreateJobPage />;
}
