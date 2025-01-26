import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getById } from "@/lib/airtable";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import type { User } from "@/lib/types";
import Link from "next/link";

export default async function JobPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const jobId = (await params).jobId;
  const [user, job] = await Promise.all([
    getById("user", session.user.id) as Promise<User>,
    getById("job", jobId),
  ]);

  if (!user || !job) {
    notFound();
  }

  const isMyJob = job.slack_id === session.user.id;
  const isPrinting = job.assigned_printer_id === session.user.id;
  const hasPrinter = user.printer_has ?? false;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-semibold">
            {job.ysws || "Untitled Job"}
          </h1>
          <p className="text-zinc-400 mt-1">Parts: {job.part_count || 0}</p>
        </div>
        {job.status && (
          <Badge
            variant={
              job.status === "done"
                ? "default"
                : job.status === "in_progress"
                ? "secondary"
                : "destructive"
            }
            className="text-sm"
          >
            {job.status}
          </Badge>
        )}
      </div>

      {job.ysws_pr_url && (
        <a
          href={job.ysws_pr_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 block"
        >
          View PR →
        </a>
      )}

      {job.stls && job.stls.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium">STL Files</h2>
          <div className="grid gap-2">
            {job.stls.map((stl: any) => (
              <a
                key={stl.id || stl.url}
                href={stl.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 p-3 bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <span className="text-zinc-400">{stl.filename}</span>
                <span className="text-xs text-zinc-500">
                  ({Math.round(stl.size / 1024)}KB)
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Controls based on user role */}
      <form className="flex gap-2 flex-wrap">
        {hasPrinter && !isPrinting && !job.assigned_printer_id && (
          <Button
            formAction={`/api/jobs/${(await params).jobId}/claim`}
            variant="outline"
          >
            Claim Job
          </Button>
        )}

        {isPrinting && (
          <>
            <Button
              formAction={`/api/jobs/${jobId}/status/in_progress`}
              variant="outline"
            >
              Start Printing
            </Button>
            <Button
              formAction={`/api/jobs/${jobId}/status/done`}
              variant="outline"
            >
              Mark Complete
            </Button>
            <Button formAction={`/api/jobs/${jobId}/unclaim`} variant="outline">
              Unclaim
            </Button>
          </>
        )}

        {isMyJob && !job.assigned_printer_id && (
          <Link href={`/dashboard/jobs/edit/${jobId}`}>
            <Button variant="outline">Edit Submission</Button>
          </Link>
        )}
      </form>
    </div>
  );
}
