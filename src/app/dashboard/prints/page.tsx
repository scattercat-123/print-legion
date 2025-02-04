import { JobCard } from "@/components/job-card";
import { auth } from "@/lib/auth";
import { searchJobs } from "@/lib/airtable";
import { redirect } from "next/navigation";
import { Notice } from "@/components/notice";
import { MessageCircleQuestion } from "lucide-react";
import Link from "next/link";

export default async function PrintsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const { data: jobs } = await searchJobs({
    formula: `{(auto)(assigned_printer)slack_id} = '${session.user.id}'`,
  });

  if (jobs.length === 0) {
    return (
      <Notice variant="default" title="No results" icon={MessageCircleQuestion}>
        Seems like we couldn&apos;t find any prints on your account. Maybe
        it&apos;s time to{" "}
        <Link
          href="/dashboard/jobs/search"
          className="underline hover:text-primary transition-colors"
        >
          find something to print
        </Link>
        ?
      </Notice>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Your Prints</h1>
      <div className="grid gap-2">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </div>
  );
}
