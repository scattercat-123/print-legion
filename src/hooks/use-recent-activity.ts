import useSWR from "swr";
import { type Job } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useRecentActivity() {
  const { data, error, isLoading } = useSWR<{
    recentJobs: (Job & { id: string })[];
    stats: {
      lastHourModifications: number;
      totalActiveJobs: number;
      totalCompletedJobs: number;
    };
  }>("/api/jobs/recent-activity", fetcher, {
    refreshInterval: 60000, // Refresh every 30 seconds
  });

  return {
    recentActivity: data,
    isLoading,
    isError: error,
  };
}
