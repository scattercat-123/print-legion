"use server";

import { auth } from "@/lib/auth";
import { getById, updateBySlackId } from "@/lib/airtable";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { JobStatusType } from "@/lib/types";

export async function claimJob(jobId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const user = await getById("user", session.user.id);
  if (!user) {
    redirect("/");
  }

  // Update the job record
  const success = await updateBySlackId("job", jobId, {
    assigned_printer: [user.id],
  });

  if (success) {
    revalidatePath(`/dashboard/${jobId}`);
    revalidatePath("/dashboard/prints");
    revalidatePath("/dashboard/jobs/search");
  }
}

export async function unclaimJob(jobId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const job = await getById("job", jobId);
  if (!job) {
    redirect("/dashboard");
  }

  // Check if user is assigned to this job
  if (job["(auto)(assigned_printer)slack_id"]?.[0] !== session.user.id) {
    redirect("/dashboard");
  }

  // Update the job record
  const success = await updateBySlackId("job", jobId, {
    assigned_printer: undefined,
  });

  if (success) {
    revalidatePath(`/dashboard/${jobId}`);
    revalidatePath("/dashboard/prints");
    revalidatePath("/dashboard/jobs/search");
  }
}

export async function updateJobStatus(jobId: string, status: JobStatusType) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const job = await getById("job", jobId);
  if (!job) {
    redirect("/dashboard");
  }

  // Check if user is assigned to this job
  if (job["(auto)(assigned_printer)slack_id"]?.[0] !== session.user.id) {
    redirect("/dashboard");
  }

  // Update the job record
  const success = await updateBySlackId("job", jobId, {
    status,
  });

  if (success) {
    revalidatePath(`/dashboard/${jobId}`);
    revalidatePath("/dashboard/prints");
    revalidatePath("/dashboard/jobs/search");
  }
}
