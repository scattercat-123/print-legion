import { JobCard } from "@/components/job-card";
import { auth } from "@/lib/auth";
import { searchJobs } from "@/lib/airtable";
import { redirect } from "next/navigation";
import { cache } from "react";
import { Notice } from "@/components/notice";
import { MessageCircleQuestion } from "lucide-react";
import Link from "next/link";

const cached_searchJobs = cache(searchJobs);
export default async function SubmissionsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const { data: jobs } = await cached_searchJobs({
    formula: `{(auto)(creator)slack_id} = '${session.user.id}'`,
  });

  if (jobs.length === 0) {
    return (
      <Notice variant="default" title="No results" icon={MessageCircleQuestion}>
        Seems like we couldn&apos;t find any submissions on your account. Maybe
        it&apos;s time to{" "}
        <Link
          href="/dashboard/jobs/create"
          className="underline hover:text-primary transition-colors"
        >
          create a new job
        </Link>
        ?
      </Notice>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Your Submissions</h1>
      <div className="grid gap-2">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </div>
  );
}
