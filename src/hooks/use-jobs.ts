import useSWRInfinite from "swr/infinite";
import type { Job } from "@/lib/types";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
};

// Hook for infinite scrolling job search
export function useJobSearch(query: string, coordinates?: string) {
  const getKey = (
    pageIndex: number,
    previousPageData: (Job & { id: string; distance?: number })[]
  ) => {
    if (previousPageData && !previousPageData.length) return null;
    return `/api/jobs/search?q=${query}&page=${pageIndex}`;
  };

  const { data, error, isLoading, size, setSize, mutate } = useSWRInfinite<
    (Job & { id: string; distance?: number })[]
  >(getKey, (url) => fetcher(`${url}&coordinates=${coordinates}`));

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
