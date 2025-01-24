import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import type { Job } from "@/lib/types";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

// Hook for fetching a single job
export function useJob(jobId: string) {
  const { data, error, isLoading, mutate } = useSWR<Job>(
    `/api/jobs/${jobId}`,
    fetcher
  );

  return {
    job: data,
    isLoading,
    isError: error,
    mutate,
  };
}

// Hook for fetching user's assigned jobs
export function useMyJobs() {
  const { data, error, isLoading, mutate } = useSWR<Job[]>(
    "/api/jobs/my-jobs",
    fetcher
  );

  return {
    jobs: data || [],
    isLoading,
    isError: error,
    mutate,
  };
}

// Hook for infinite scrolling job search
export function useJobSearch(query: string) {
  const getKey = (pageIndex: number, previousPageData: (Job & { id: string })[]) => {
    if (previousPageData && !previousPageData.length) return null;
    return `/api/jobs/search?q=${query}&page=${pageIndex + 1}`;
  };

  const { data, error, isLoading, size, setSize, mutate } = useSWRInfinite<
    (Job & { id: string })[]
  >(getKey, fetcher);

  const jobs = data ? data.flat() : [];
  const isEmpty = data?.[0]?.length === 0;
  const isReachingEnd = isEmpty || (data && data[data.length - 1]?.length < 10);

  return {
    jobs,
    isLoading,
    isError: error,
    size,
    setSize,
    isReachingEnd,
    mutate,
  };
}
