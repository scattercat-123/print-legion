"use server";

import { auth } from "@/lib/auth";
import { createRecord, getById, updateBySlackId } from "@/lib/airtable";
import { revalidatePath } from "next/cache";
import type { User, JobStatusType } from "@/lib/types";
import { geocodeSearch } from "@/lib/geo";

export async function claimJob(jobId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  const printer = await getById("user", session.user.id);
  if (!printer?.id) {
    throw new Error("Printer not found");
  }

  // Update the user record
  const success = await updateBySlackId("job", jobId, {
    assigned_printer: [printer.id],
    status: "claimed" as JobStatusType,
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
  if (!job["(auto)(assigned_printer)slack_id"]?.includes(session.user.id)) {
    throw new Error("Not assigned to this job");
  }

  // Update the user record
  const success = await updateBySlackId("job", jobId, {
    assigned_printer: undefined,
    status: "needs_printer" as JobStatusType,
  });

  if (success) {
    revalidatePath("/dashboard/jobs");
    return { success: true };
  }

  throw new Error("Failed to unclaim job");
}

export async function updateJobStatus(jobId: string, status: JobStatusType) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  const job = await getById("job", jobId);
  if (!job) {
    throw new Error("Job not found");
  }

  // Check if user is assigned to this job
  if (!job["(auto)(assigned_printer)slack_id"]?.includes(session.user.id)) {
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

  const creator = await getById("user", session.user.id);
  if (!creator?.id) {
    throw new Error("Creator not found");
  }

  // Extract form data
  const ysws = JSON.parse(formData.get("ysws")?.toString() || "[]");
  const ysws_pr_url = formData.get("pr_url")?.toString();
  const part_count = Number.parseInt(
    formData.get("part_count")?.toString() || "0",
    10
  );
  const item_name = formData.get("item_name")?.toString();
  const item_description = formData.get("item_description")?.toString();

  if (!item_name || !item_description) {
    throw new Error("Item name and description are required");
  }

  if (part_count <= 0) {
    throw new Error("Part count must be greater than 0");
  }

  if (ysws.length === 0) {
    throw new Error("You must select a YSWS");
  }

  // Create the initial job record without files
  const result = await createRecord("job", {
    creator: [creator.id],
    need_printed_parts: true,
    stls: [], // Start with empty array
    ysws,
    ysws_pr_url,
    part_count,
    item_name,
    item_description,
  });

  if (!result.success || !result.id) {
    throw new Error("Failed to create job");
  }

  await updateBySlackId("user", session.user.id, {
    has_ever_submitted: true,
  });

  revalidatePath("/dashboard/jobs");
  return { success: true, jobId: result.id };
}

export async function updateUserSettings(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  // Extract form data
  const preferred_ysws_form = formData.get("preferred_ysws")?.toString();
  const printer_type = formData.get("printer_type")?.toString();
  const printer_details = formData.get("printer_details")?.toString();
  const has_printer = formData.get("has_printer")?.toString();
  const region_coordinates = formData.get("region_coordinates")?.toString();
  const region_complete_name = formData.get("region_complete_name")?.toString();
  const user = await getById("user", session.user.id);
  const onboarded = formData.get("onboarded")
    ? formData.get("onboarded") === "on"
    : undefined;

  const obj: User = {
    slack_id: session.user.id,
    preferred_ysws: preferred_ysws_form
      ? JSON.parse(preferred_ysws_form)
      : undefined,
    printer_has: has_printer === "on",
    printer_type,
    printer_details,
    onboarded,
    region_coordinates,
    region_complete_name,
  };

  if (!user) {
    const success = await createRecord("user", obj);
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

const cleanDisplayName = (displayName: string) => {
  const split = displayName.split(",");
  if (split.length < 4) return displayName;

  // pick the first 3 and the last 2
  const firstThree = split.slice(0, 2).join(",");
  const lastTwo = split.slice(-2).join(",");
  return `${firstThree}, ${lastTwo}`
    .split(",")
    .map((s) => s.trim())
    .join(", ");
};

export async function searchLocations(query: string) {
  const results = await geocodeSearch(query);
  const seen: Set<string> = new Set();
  const seen_coords: Set<string> = new Set();
  return results.reduce((acc, result) => {
    const clean_name = cleanDisplayName(result.display_name);
    if (seen.has(clean_name)) {
      return acc;
    }
    if (seen_coords.has(`${result.lat},${result.lon}`)) {
      return acc;
    }
    seen.add(clean_name);
    seen_coords.add(`${result.lat},${result.lon}`);
    acc.push({
      value: `${result.lat},${result.lon}`,
      label: clean_name,
    });
    return acc;
  }, [] as { value: string; label: string }[]);
}
