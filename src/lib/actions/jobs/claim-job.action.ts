"use server";
import "server-only";
import { getById, searchJobs, updateBySlackId } from "@/lib/airtable";
import { auth } from "@/lib/auth";
import { max_meetup_distance_km } from "@/lib/consts";
import { getDistance } from "@/lib/distance";
import { JobStatusType } from "@/lib/types";
import { revalidatePath } from "next/cache";

export async function claimJob(jobId: string) {
  const session = await auth();
  const user = await getById("user", session?.user?.id, {
    throwOnNotFound: true,
  });

  const job = await getById("job", jobId, {
    throwOnNotFound: true,
    includeSensitiveFields: true,
  });

  if (job["(auto)(creator)slack_id"]?.[0] === user.slack_id) {
    throw new Error("You cannot claim your own job...");
  }

  if (job.status !== "needs_printer") {
    throw new Error("Job is not in a state where it can be claimed");
  }

  if (job.assigned_printer && job.assigned_printer.length !== 0) {
    throw new Error("Job is already claimed");
  }

  const loc_submitter = job["(auto)(creator)region_coordinates"]?.[0];
  const loc_claimer = user.region_coordinates;

  if (!loc_submitter || !loc_claimer) {
    throw new Error(
      "Either the job creator or the user has not set their location"
    );
  }

  const distance = getDistance(loc_submitter, loc_claimer);
  if (distance > max_meetup_distance_km) {
    throw new Error(
      `You are further than ${max_meetup_distance_km}km from the job location!`
    );
  }

  const existing_jobs = await searchJobs({
    formula: `AND(
      {(auto)(assigned_printer)slack_id}='${user.slack_id}',
      OR(
        {status}='claimed',
        {status}='printing_in_progress',
        {status}='completed_printing'
      )
    )`,
    pageSize: 100,
    throwOnError: true,
  });
  if (existing_jobs.data.length >= 1) {
    throw new Error(
      "You already have an ongoing print job - please finish that one first!"
    );
  }

  const success = await updateBySlackId("job", jobId, {
    assigned_printer: [user.id],
    status: "claimed" as JobStatusType,
  });

  if (success) {
    revalidatePath(`/dashboard/jobs/${jobId}`);
    revalidatePath("/dashboard/prints");
    revalidatePath("/dashboard/jobs/search");
    return { success: true };
  }

  throw new Error("Failed to claim job");
}
