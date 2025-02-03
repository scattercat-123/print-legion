"use server";
import "server-only";
import { getById, updateBySlackId } from "@/lib/airtable";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const UpdateStartingPrinting = z.object({
  status: z.literal("printing_in_progress"),
});

const UpdateCompletedPrinting = z.object({
  status: z.literal("completed_printing"),
  filament_used: z.number().min(0),
  printing_notes: z.string().optional(),
});

const UpdateFulfiled = z.object({
  status: z.literal("fulfilled_awaiting_confirmation"),
  fulfilment_notes: z.string().optional(),
});

const UpdateConfirmFulfilment = z.object({
  status: z.literal("finished"),
});

const UpdateCancelled = z.object({
  status: z.literal("cancelled"),
});

const StatusUpdateSchema = z.union([
  UpdateStartingPrinting,
  UpdateCompletedPrinting,
  UpdateFulfiled,
  UpdateConfirmFulfilment,
  UpdateCancelled,
]);

export async function updateJobStatus(jobId: string, data: z.infer<typeof StatusUpdateSchema>) {
  const update = StatusUpdateSchema.parse(data);

  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const job = await getById("job", jobId, { throwOnNotFound: true });

  //   printer - start printing, complete printing, fulfiled, cancel
  // submitter - confirm fulfilment, cancel

  const isPrinter = job["(auto)(assigned_printer)slack_id"]?.[0] === session.user.id;

  const isSubmitter = job["(auto)(creator)slack_id"]?.[0] === session.user.id;

  if (
    (update.status === "printing_in_progress" ||
      update.status === "completed_printing" ||
      update.status === "fulfilled_awaiting_confirmation") &&
    !isPrinter
  ) {
    throw new Error("Not authorized to execute this action!");
  }

  if (update.status === "finished" && !isSubmitter) {
    throw new Error("Not authorized to execute this action!");
  }

  if (update.status === "cancelled" && !isSubmitter && !isPrinter) {
    throw new Error("Not authorized to execute this action!");
  }

  const success = await updateBySlackId("job", jobId, update);

  if (success) {
    revalidatePath(`/dashboard/jobs/${jobId}`);
    return { success: true };
  }

  throw new Error("Failed to update job status");
}
