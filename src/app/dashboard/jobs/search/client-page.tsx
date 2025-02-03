"use client";

import { useState, useCallback, type ChangeEvent } from "react";
import { useJobSearch } from "@/hooks/use-jobs";
import { JobCard } from "@/components/job-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MessageCircleQuestion, Search, TriangleAlert } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { User } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Notice } from "@/components/notice";

export default function SearchPage({ user }: { user: User }) {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, 500);

  const { jobs, isLoading, error, size, setSize, isReachingEnd } = useJobSearch(
    debouncedQuery,
    user?.region_coordinates
  );

  console.log(jobs);
  const loadMore = useCallback(() => {
    setSize(size + 1);
  }, [setSize, size]);

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search jobs..."
            value={searchQuery}
            onChange={handleSearch}
            className="pl-10"
          />
        </div>
      </div>
      {isLoading && jobs.length === 0 ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="w-full h-[10.75rem] rounded-xl" />
          <Skeleton className="w-full h-[10.75rem] rounded-xl" />
          <Skeleton className="w-full h-[10.75rem] rounded-xl" />
        </div>
      ) : error ? (
        <Notice variant="error" title="Error" icon={TriangleAlert}>
          {(error as Error).message}
        </Notice>
      ) : jobs.length === 0 ? (
        <Notice
          variant="default"
          title="No results"
          icon={MessageCircleQuestion}
        >
          {debouncedQuery.length > 0 ? (
            "Seems like we couldn&apos;t find any results for your search - try a different search term?"
          ) : (
            <span>
              Seems like we couldn&apos;t find any jobs in your area - maybe ask
              around in{" "}
              <a
                href="https://hackclub.slack.com/archives/C083P4FJM46"
                target="_blank"
              >
                #printing-legion
              </a>
              ?
            </span>
          )}
        </Notice>
      ) : (
        <>
          <div className="grid gap-2">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>

          {!isReachingEnd && (
            <div className="flex justify-center mt-8">
              <Button onClick={loadMore} variant="outline" disabled={isLoading}>
                {isLoading ? "Loading..." : "Load More"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
