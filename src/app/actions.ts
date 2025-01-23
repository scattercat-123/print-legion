"use server";

import { auth } from "@/lib/auth";
import { createBySlackId, getBySlackId, updateBySlackId } from "@/lib/airtable";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { nanoid } from "nanoid";

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

  const user = await getBySlackId("user", session.user.id);
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

  const job = await getBySlackId("job", jobId);
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

export async function updateJobStatus(jobId: string, status: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  const job = await getBySlackId("job", jobId);
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

  const user = await getBySlackId("user", session.user.id);
  if (!user) {
    throw new Error("User not found");
  }

  // Extract form data
  const stls = formData.getAll("stls") as File[];
  const ysws = formData.get("ysws")?.toString();
  const ysws_pr_url = formData.get("ysws_pr_url")?.toString();
  const part_count = Number.parseInt(
    formData.get("part_count")?.toString() || "0",
    10
  );

  // Update the user record
  const success = await updateBySlackId("job", nanoid(12), {
    need_printed_parts: true,
    stls: stls.map((file) => ({
      filename: file.name,
      size: file.size,
      type: file.type,
    })) as AirtableAttachment[],
    ysws,
    ysws_pr_url,
    part_count,
    status: "pending",
  });

  if (success) {
    revalidatePath("/dashboard/jobs");
    return { success: true };
  }

  throw new Error("Failed to create job");
}

export async function updateUserSettings(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  // Extract form data
  const available_ysws = formData.get("available_ysws")?.toString();
  const what_type = formData.get("what_type")?.toString();
  const has_printer = formData.get("has_printer")?.toString();
  const user = await getBySlackId("user", session.user.id);
  if (!user) {
    const success = await createBySlackId("user", {
      slack_id: session.user.id,
      available_ysws,
      "What Type?": what_type,
    });
    if (!success) {
      throw new Error("Failed to create user");
    }
    return { success: true };
  }

  // Update the printer record
  const success = await updateBySlackId("user", session.user.id, {
    available_ysws,
    "What Type?": what_type,
    printer_has: has_printer === "on",
  });

  if (success) {
    revalidatePath("/dashboard/settings");
    return { success: true };
  }

  throw new Error("Failed to update settings");
}
