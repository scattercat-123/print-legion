"use client";

import { use, useState } from "react";
import { type GlobalStats } from "@/lib/actions/stats.action";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import dynamic from "next/dynamic";
import { Loader2, Percent, Printer, User2 } from "lucide-react";
import { useHydration } from "@/hooks/use-hydration";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const MapComponent = dynamic(() => import("@/components/map"), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-[621/350] rounded-b-lg bg-transparent flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  ),
});

const StatCard = ({ title, value }: { title: string; value: number }) => {
  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle className="text-2xl font-bold">{value}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground">{title}</p>
      </CardContent>
    </Card>
  );
};

export default function StatsPage({
  stats_promise,
}: {
  stats_promise: Promise<GlobalStats | undefined>;
}) {
  const stats = use(stats_promise);
  const hydrated = useHydration();
  const [activeGraph, setActiveGraph] = useState<
    "printers" | "users" | "density"
  >("users");

  if (!stats) return <p>error</p>;

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      <div className="flex flex-col">
        <h1 className="text-2xl font-semibold">Network Stats</h1>
        {hydrated ? (
          <p className="text-sm text-muted-foreground">
            Last updated {new Date(stats.lastUpdated).toLocaleDateString()} at{" "}
            {new Date(stats.lastUpdated).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })}
          </p>
        ) : (
          <Skeleton className="mt-0.5 w-full h-5 max-w-[300px] rounded-sm" />
        )}
      </div>

      <div className="border rounded-xl relative shadow-sm">
        <div className="flex-col flex px-4 pt-3">
          <h3 className="text-lg tracking-tighter font-semibold">
            Global Distribution
          </h3>
          <p className="text-sm text-muted-foreground mb-2">
            {activeGraph === "printers"
              ? "Printer count by country"
              : activeGraph === "users"
              ? "User count by country"
              : "% Printer density by country"}
          </p>

          <div className="xs:absolute top-3 right-3 mb-2">
            <Button
              onClick={() => setActiveGraph("users")}
              variant="outline"
              className={cn(
                "rounded-none rounded-l-xl h-9 xs:px-2.5 ±±",
                activeGraph === "users"
                  ? "bg-border text-border-foreground"
                  : "!bg-transparent text-muted-foreground"
              )}
            >
              <User2 className="w-4 h-4" />
              <span
                className={cn(
                  activeGraph === "users"
                    ? "ml-1.5 xs:hidden lg:block"
                    : "hidden"
                )}
              >
                Users
              </span>
            </Button>
            <Button
              onClick={() => setActiveGraph("printers")}
              variant="outline"
              className={cn(
                "rounded-none border-x-0 h-9 xs:px-2.5 ±±",
                activeGraph === "printers"
                  ? "bg-border text-border-foreground"
                  : "!bg-transparent text-muted-foreground"
              )}
            >
              <Printer className="w-4 h-4" />
              <span
                className={cn(
                  activeGraph === "printers"
                    ? "ml-1.5 xs:hidden lg:block"
                    : "hidden"
                )}
              >
                Printers
              </span>
            </Button>
            <Button
              onClick={() => setActiveGraph("density")}
              variant="outline"
              className={cn(
                "rounded-none rounded-r-xl h-9 xs:px-2.5 ±±",
                activeGraph === "density"
                  ? "bg-border text-border-foreground"
                  : "!bg-transparent text-muted-foreground"
              )}
            >
              <Percent className="w-4 h-4" />
              <span
                className={cn(
                  activeGraph === "density"
                    ? "ml-1.5 xs:hidden lg:block"
                    : "hidden"
                )}
              >
                Density
              </span>
            </Button>
          </div>
        </div>
        <MapComponent
          points={stats.countryStats}
          className="w-full"
          activeGraph={activeGraph}
        />
      </div>

      <div className="grid gap-1.5 lg:gap-[0.5625rem] grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col col-span-2 space-y-1.5">
          <h3 className="text-lg tracking-tighter font-semibold">
            Global Stats
          </h3>
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-1.5 lg:gap-[0.5625rem]">
            <StatCard title="Users" value={stats.totalUsers} />
            <StatCard title="Printers" value={stats.totalPrinters} />
            <StatCard
              title="Needing Prints"
              value={stats.totalUsers - stats.totalPrinters}
            />
            <StatCard title="Print Jobs" value={stats.totalPrintJobs} />
            <StatCard
              title="kgs of Filament"
              value={(stats.totalFilamentUsed ?? 0) / 1000}
            />
            <StatCard title="Countries" value={stats.countryStats.length} />
          </div>
        </div>

        <div className="flex flex-col col-span-2 space-y-1.5 mt-4 lg:mt-0">
          <h3 className="text-lg tracking-tighter font-semibold">
            Top 10 countries (by{" "}
            {activeGraph === "printers"
              ? "printers"
              : activeGraph === "users"
              ? "users"
              : "density"}
            )
          </h3>

          <Card className="flex flex-row items-center">
            <CardContent className="py-1.5 px-1.5 flex flex-col w-full">
              {stats.countryStats
                .map((country) => {
                  const value =
                    activeGraph === "printers"
                      ? country.printerCount
                      : activeGraph === "users"
                      ? country.userCount
                      : country.printerCount / country.userCount;

                  return { ...country, value };
                })
                .sort((a, b) => b.value - a.value)
                .slice(0, 10)
                .map((country) => (
                  <div
                    className="text-sm hover:bg-muted transition-colors w-full px-1.5 py-0.5 rounded-sm flex items-center"
                    key={country.countryCode}
                  >
                    {country.countryFlagEmoji} {country.countryName}
                    <div className="flex-grow"></div>
                    <p className="text-sm text-muted-foreground">
                      {activeGraph === "printers"
                        ? country.printerCount
                        : activeGraph === "users"
                        ? country.userCount
                        : `${(
                            (country.printerCount / country.userCount) *
                            100
                          ).toFixed(0)}%`}
                    </p>
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>

        {stats.userStats && (
          <div className="flex flex-col col-span-2 lg:col-span-4 space-y-1.5 mt-4">
            <h3 className="text-lg tracking-tighter font-semibold">
              Printers near you
            </h3>
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-4 gap-1.5 lg:gap-[0.5625rem]">
              <StatCard title="5km radius" value={stats.userStats.radius5km} />
              <StatCard
                title="25km radius"
                value={stats.userStats.radius25km}
              />
              <StatCard
                title="50km radius"
                value={stats.totalUsers - stats.totalPrinters}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
