import { auth } from "@/lib/auth";
import { redirect, RedirectType } from "next/navigation";

export default async function Home() {
  const session = await auth();
  if (!session?.user?.id) {
    return redirect("/login", RedirectType.replace);
  }
  return redirect("/dashboard", RedirectType.replace);
}
