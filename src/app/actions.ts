"use server";

import { auth } from "@/lib/auth";
import {
  createBySlackId,
  getById,
  updateBySlackId,
  searchJobs,
} from "@/lib/airtable";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { nanoid } from "nanoid";
import type { Job, User } from "@/lib/types";

// Define a type for Airtable attachments
interface AirtableAttachment {
  id: string;
  url: string;
  filename: string;
  size: number;
  type: string;
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

  // Update the user record
  const success = await updateBySlackId("job", jobId, {
    assigned_printer_id: user.slack_id,
  });

  if (success) {
    revalidatePath("/dashboard/jobs");
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

  // Check if user is assigned to this job
  if (job.assigned_printer_id !== session.user.id) {
    throw new Error("Not assigned to this job");
  }

  // Update the user record
  const success = await updateBySlackId("job", jobId, {
    assigned_printer_id: undefined,
  });

  if (success) {
    revalidatePath("/dashboard/jobs");
    return { success: true };
  }

  throw new Error("Failed to unclaim job");
}

export async function updateJobStatus(
  jobId: string,
  status: "in_progress" | "done" | "cancelled"
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  const job = await getById("job", jobId);
  if (!job) {
    throw new Error("Job not found");
  }

  // Check if user is assigned to this job
  if (job.assigned_printer_id !== session.user.id) {
    throw new Error("Not assigned to this job");
  }

  // Update the user record
  const success = await updateBySlackId("job", jobId, {
    status,
  });

  if (success) {
    revalidatePath("/dashboard/jobs");
    return { success: true };
  }

  throw new Error("Failed to update job status");
}

export async function createJob(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  const user = await getById("user", session.user.id);
  if (!user) {
    throw new Error("User not found");
  }

  // Extract form data
  const ysws = JSON.parse(formData.get("ysws")?.toString() || "[]");
  const ysws_pr_url = formData.get("ysws_pr_url")?.toString();
  const part_count = Number.parseInt(
    formData.get("part_count")?.toString() || "0",
    10
  );

  // Create the initial job record without files
  const result = await createBySlackId("job", {
    slack_id: user.slack_id,
    need_printed_parts: true,
    stls: [], // Start with empty array
    ysws,
    ysws_pr_url,
    part_count,
  });

  if (!result.success || !result.id) {
    throw new Error("Failed to create job");
  }

  revalidatePath("/dashboard/jobs");
  return { success: true, jobId: result.id };
}

export async function updateUserSettings(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  // Extract form data
  const preferred_ysws = JSON.parse(
    formData.get("preferred_ysws")?.toString() || "[]"
  );
  const printer_type = formData.get("printer_type")?.toString();
  const printer_details = formData.get("printer_details")?.toString();
  const has_printer = formData.get("has_printer")?.toString();
  const region_coordinates = formData.get("region_coordinates")?.toString();
  const user = await getById("user", session.user.id);
  const onboarded = formData.get("onboarded")
    ? formData.get("onboarded") === "on"
    : undefined;

  const obj: User = {
    slack_id: session.user.id,
    preferred_ysws,
    printer_has: has_printer === "on",
    printer_type,
    printer_details,
    onboarded,
    region_coordinates,
  };

  if (!user) {
    const success = await createBySlackId("user", obj);
    if (!success) {
      throw new Error("Failed to create user");
    }
    return { success: true };
  }

  // Update the printer record
  const success = await updateBySlackId("user", session.user.id, obj);

  if (success) {
    revalidatePath("/dashboard/settings");
    return { success: true };
  }

  throw new Error("Failed to update settings");
}
