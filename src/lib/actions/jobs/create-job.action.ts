"use server";
import "server-only";

import { auth } from "@/lib/auth";
import { createRecord, getById, updateBySlackId } from "@/lib/airtable";
import { revalidatePath } from "next/cache";

export async function createJob(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const creator = await getById("user", session.user.id);
  if (!creator?.id) throw new Error("Creator not found");

  // Extract form data
  const ysws = JSON.parse(formData.get("ysws")?.toString() || "[]");
  const ysws_pr_url = formData.get("pr_url")?.toString();
  const part_count = Number.parseInt(formData.get("part_count")?.toString() || "0", 10);
  const item_name = formData.get("item_name")?.toString();
  const item_description = formData.get("item_description")?.toString();

  if (!item_name || !item_description) {
    throw new Error("Item name and description are required");
  }

  if (part_count <= 0) {
    throw new Error("Part count must be greater than 0");
  }

  if (ysws.length !== 1) {
    throw new Error("You must select a single YSWS");
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
    status: "needs_printer",
  });

  if (!result.success || !result.id) {
    throw new Error("Failed to create job");
  }

  // used if a submitter becomes a printer - flag to show past submissions without a lookup
  await updateBySlackId("user", session.user.id, {
    has_ever_submitted: true,
  });

  revalidatePath("/dashboard/jobs");
  return { success: true, jobId: result.id };
}
