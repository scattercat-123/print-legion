"use server";
import "server-only";
import { getById, updateBySlackId } from "@/lib/airtable";
import { auth } from "@/lib/auth";
import { JobStatusType } from "@/lib/types";
import { revalidatePath } from "next/cache";

export async function unclaimJob(jobId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const job = await getById("job", jobId, { throwOnNotFound: true });

  // Check if user is assigned to this job
  if (job["(auto)(assigned_printer)slack_id"]?.[0] !== session.user.id) {
    throw new Error("Not assigned to this job");
  }

  if (
    job.status === "printing_in_progress" ||
    job.status === "completed_printing" ||
    job.status === "finished" ||
    job.status === "fulfilled_awaiting_confirmation" ||
    job.status === "cancelled"
  ) {
    throw new Error("Job is already past state of being unclaimed...");
  }

  // Update the job record
  const success = await updateBySlackId("job", jobId, {
    assigned_printer: [],
    status: "needs_printer" as JobStatusType,
  });

  if (success) {
    revalidatePath(`/dashboard/${jobId}`);
    revalidatePath("/dashboard/prints");
    revalidatePath("/dashboard/jobs/search");
    return { success: true };
  }

  throw new Error("Failed to unclaim job");
}
