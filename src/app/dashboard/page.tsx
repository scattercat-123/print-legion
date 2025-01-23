"use client";

import { useMyJobs } from "@/hooks/use-jobs";
import { JobCard } from "@/components/job-card";

export default function JobsPage() {
  const { jobs, isLoading, isError } = useMyJobs();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-zinc-400">Loading jobs...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-400">Error loading jobs</p>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-zinc-400">No jobs found</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Your Jobs</h1>
      <div className="grid gap-4">
        {jobs.map((job) => (
          <JobCard key={job.slack_id} job={job} isAssigned={true} />
        ))}
      </div>
    </div>
  );
}
