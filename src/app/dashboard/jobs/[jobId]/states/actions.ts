"use server";

import { auth } from "@/lib/auth";
import { getById, updateBySlackId } from "@/lib/airtable";
import { revalidatePath } from "next/cache";
import type { FilamentUsage, FulfillmentPhoto } from "./types";
import type { JobStatusType } from "@/lib/types";

export async function startPrinting(jobId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  const job = await getById("job", jobId);
  if (!job) {
    throw new Error("Job not found");
  }

  if (job["(auto)(assigned_printer)slack_id"]?.[0] !== session.user.id) {
    throw new Error("Not authorized to start this print");
  }

  const success = await updateBySlackId("job", jobId, {
    status: "printing_in_progress" as JobStatusType,
  });

  if (success) {
    revalidatePath(`/dashboard/jobs/${jobId}`);
    return { success: true };
  }

  throw new Error("Failed to start printing");
}

export async function completePrinting(
  jobId: string,
  filamentUsage: FilamentUsage
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  const job = await getById("job", jobId);
  if (!job) {
    throw new Error("Job not found");
  }

  if (job["(auto)(assigned_printer)slack_id"]?.[0] !== session.user.id) {
    throw new Error("Not authorized to complete this print");
  }

  const success = await updateBySlackId("job", jobId, {
    status: "completed_printing" as JobStatusType,
    filament_used: filamentUsage.grams,
    printing_notes: filamentUsage.notes,
  });

  if (success) {
    revalidatePath(`/dashboard/jobs/${jobId}`);
    return { success: true };
  }

  throw new Error("Failed to complete printing");
}

export async function markFulfilled(
  jobId: string,
  fulfillmentPhoto: FulfillmentPhoto
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  const job = await getById("job", jobId);
  if (!job) {
    throw new Error("Job not found");
  }

  if (job["(auto)(assigned_printer)slack_id"]?.[0] !== session.user.id) {
    throw new Error("Not authorized to mark this job as fulfilled");
  }

  // TODO: Upload fulfillment photo using existing upload logic
  // const uploadFormData = new FormData();
  // uploadFormData.append("file", fulfillmentPhoto.file);
  // uploadFormData.append("fileType", "fulfillment_photo");
  // uploadFormData.append("description", fulfillmentPhoto.description || "");

  const success = await updateBySlackId("job", jobId, {
    status: "fulfilled_awaiting_confirmation" as JobStatusType,
  });

  if (success) {
    revalidatePath(`/dashboard/jobs/${jobId}`);
    return { success: true };
  }

  throw new Error("Failed to mark as fulfilled");
}

export async function confirmFulfillment(jobId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  const job = await getById("job", jobId);
  if (!job) {
    throw new Error("Job not found");
  }

  if (job["(auto)(creator)slack_id"]?.[0] !== session.user.id) {
    throw new Error("Not authorized to confirm this fulfillment");
  }

  const success = await updateBySlackId("job", jobId, {
    status: "finished" as JobStatusType,
  });

  if (success) {
    revalidatePath(`/dashboard/jobs/${jobId}`);
    return { success: true };
  }

  throw new Error("Failed to confirm fulfillment");
}

export async function claimJob(jobId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  const user = await getById("user", session.user.id);
  if (!user) {
    throw new Error("User not found");
  }

  const success = await updateBySlackId("job", jobId, {
    assigned_printer: [user.id],
    status: "claimed" as JobStatusType,
  });

  if (success) {
    revalidatePath(`/dashboard/jobs/${jobId}`);
    return { success: true };
  }

  throw new Error("Failed to claim job");
}

export async function unclaimJob(jobId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  const job = await getById("job", jobId);
  if (!job) {
    throw new Error("Job not found");
  }

  if (job["(auto)(assigned_printer)slack_id"]?.[0] !== session.user.id) {
    throw new Error("Not authorized to unclaim this job");
  }

  const success = await updateBySlackId("job", jobId, {
    assigned_printer: undefined,
    status: "needs_printer" as JobStatusType,
  });

  if (success) {
    revalidatePath(`/dashboard/jobs/${jobId}`);
    return { success: true };
  }

  throw new Error("Failed to unclaim job");
}
