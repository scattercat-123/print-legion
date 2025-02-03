import useSWRInfinite from "swr/infinite";
import type { Job } from "@/lib/types";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(errorCodes[data.code as keyof typeof errorCodes]);
  return data;
};

const errorCodes = {
  401: "Unauthorized",
  701: "Since nearby jobs are shown based on your location, please set your location in settings, then try again.",
  500: "Seems like we had a little hiccup. Please try again later.",
};

type JobAPIResponse = { jobs: (Job & { id: string; distance?: number })[]; next_offset: string | undefined };

// Hook for infinite scrolling job search
export function useJobSearch(query: string, coordinates?: string) {
  const getKey = (pageIndex: number, previousPageData: JobAPIResponse) => {
    if (previousPageData && !previousPageData.jobs?.length) return null;
    if (pageIndex === 0) return `/api/jobs/search?q=${query}`;

    return `/api/jobs/search?q=${query}&offset=${previousPageData.next_offset}`;
  };

  const { data, error, isLoading, size, setSize, mutate } = useSWRInfinite<JobAPIResponse>(
    getKey,
    (url) => fetcher(`${url}&coordinates=${coordinates}`),
    {
      revalidateAll: false,
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    },
  );

  const jobs = data?.length ? data.flatMap((page) => page.jobs) : [];
  // const isEmpty = data?.[0]?.data.length === 0;
  // const isReachingEnd = isEmpty || (data && data[data.length - 1]?.data.length < 10);
  const isEmpty = jobs.length === 0;
  const isReachingEnd = isEmpty || (data && data[data.length - 1]?.jobs.length < 10);

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
