import { JobCard } from "@/components/job-card";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { searchJobs } from "@/lib/airtable";
import { redirect } from "next/navigation";
import { cache } from "react";

const cached_searchJobs = cache(searchJobs);
export default async function SubmissionsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const jobs = await cached_searchJobs({
    query: `{slack_id} = '${session.user.id}'`,
    mode: "formula",
  });

  if (jobs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-zinc-400">No submissions found</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Your Submissions</h1>
      <div className="grid gap-4">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </div>
  );
}
