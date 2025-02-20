import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import StatsPage from "./client-page";
import { getStats, GlobalStats } from "@/lib/actions/stats.action";
import { Suspense } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const Fallback = () => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col">
        <h1 className="text-2xl font-semibold">Network Stats</h1>
        <Skeleton className="mt-1 w-full h-5 max-w-[300px] rounded-sm" />
        {/* <Skeleton className="mt-1 h-3 max-w-[300px]" /> */}
      </div>

      <Card className="border rounded-xl relative shadow-sm">
        <div className="flex-col flex px-4 pt-3">
          <h3 className="text-lg tracking-tighter">
            <Skeleton className="h-6 w-[150px]" />
          </h3>
          <div className="mb-2 mt-1">
            <Skeleton className="h-4 w-[180px]" />
          </div>
          <div className="xs:absolute top-3 right-3 mb-2">
            <Skeleton className="h-9 w-[200px]" />
          </div>
        </div>
        <Skeleton className="w-full aspect-[621/350] rounded-none rounded-b-xl" />
      </Card>

      <div className="grid gap-1.5 lg:gap-[0.5625rem] grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col col-span-2 space-y-1.5">
          <h3 className="text-lg tracking-tighter">
            <Skeleton className="h-6 w-[120px]" />
          </h3>
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-1.5 lg:gap-[0.5625rem]">
            {[...Array(6)].map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
              <Card key={`stat-${i}`}>
                <CardHeader className="pb-0">
                  <CardTitle>
                    <Skeleton className="h-8 w-[60px]" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-1">
                  <Skeleton className="h-4 w-[80px]" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="flex flex-col col-span-2 space-y-1.5 mt-4 lg:mt-0">
          <h3 className="text-lg tracking-tighter">
            <Skeleton className="h-6 w-[200px]" />
          </h3>
          <Card>
            <CardContent className="py-1.5 px-1.5">
              {[...Array(10)].map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                <div key={`country-${i}`} className="px-1.5 py-0.5">
                  <Skeleton className="h-6 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col col-span-2 lg:col-span-4 space-y-1.5 mt-4">
          <h3 className="text-lg tracking-tighter">
            <Skeleton className="h-6 w-[150px]" />
          </h3>
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-4 gap-1.5 lg:gap-[0.5625rem]">
            {[...Array(3)].map((_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
              <Card key={`nearby-${i}`}>
                <CardHeader className="pb-0">
                  <CardTitle>
                    <Skeleton className="h-8 w-[60px]" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-1">
                  <Skeleton className="h-4 w-[80px]" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default async function Page() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const stats = new Promise<GlobalStats | undefined>((resolve) =>
    getStats()
      .then(resolve)
      .catch(() => resolve(undefined))
  );

  return (
    <Suspense fallback={<Fallback />}>
      <StatsPage stats_promise={stats} />
    </Suspense>
  );
}
