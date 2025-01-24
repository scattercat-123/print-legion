"use client";

import { useState, useCallback, type ChangeEvent } from "react";
import { useJobSearch } from "@/hooks/use-jobs";
import { JobCard } from "@/components/job-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, 500);

  const { jobs, isLoading, isError, size, setSize, isReachingEnd } =
    useJobSearch(debouncedQuery);

  console.log(jobs);
  const loadMore = useCallback(() => {
    setSize(size + 1);
  }, [setSize, size]);

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="space-y-8">
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
        <div className="flex items-center justify-center h-64">
          <p className="text-zinc-400">Loading jobs...</p>
        </div>
      ) : isError ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-red-400">Error loading jobs</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-zinc-400">No jobs found</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4">
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
