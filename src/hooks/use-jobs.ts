import useSWRInfinite from "swr/infinite";
import type { Job } from "@/lib/types";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok)
    throw new Error(errorCodes[data.code as keyof typeof errorCodes]);
  return data;
};

const errorCodes = {
  401: "Unauthorized",
  701: "Since nearby jobs are shown based on your location, please set your location in settings, then try again.",
  500: "Seems like we had a little hiccup. Please try again later.",
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
    error,
    size,
    setSize,
    isReachingEnd,
    mutate,
  };
}
