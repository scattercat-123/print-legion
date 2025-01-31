import { auth } from "@/lib/auth";
import SearchPage from "./client-page";
import { redirect } from "next/navigation";
import { cached_getById } from "../../layout";

export default async function Page() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await cached_getById("user", session.user.id);
  if (!user) redirect("/login");

  return <SearchPage user={user} />;
}
