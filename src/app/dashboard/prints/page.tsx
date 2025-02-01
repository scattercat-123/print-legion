import { JobCard } from "@/components/job-card";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { searchJobs } from "@/lib/airtable";
import { redirect } from "next/navigation";

export default async function PrintsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const jobs = await searchJobs({
    formula: `{(auto)(assigned_printer)slack_id} = '${session.user.id}'`,
  });

  if (jobs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-zinc-400">No prints found</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Your Prints</h1>
      <div className="grid gap-2">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} isAssigned={true} />
        ))}
      </div>
    </div>
  );
}
