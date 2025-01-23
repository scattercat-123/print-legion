import { z } from "zod";

// User table schema
export const JobSchema = z.object({
  slack_id: z.string(),
  assigned_printer_id: z.string().optional(),
  need_printed_parts: z.boolean().default(false).optional(),
  part_count: z.number().optional(),
  status: z.string().optional(),
  stls: z.array(z.any()).optional(), // Airtable attachments
  ysws: z.string().optional(),
  ysws_pr_url: z.string().optional(),
});

// Printer table schema
export const UserSchema = z.object({
  slack_id: z.string(),
  Assigned_YSWS: z.string().optional(),
  available_ysws: z.string().optional(),
  has_been_picked: z.boolean().default(false).optional(),
  printer_has: z.boolean().default(false).optional(),
  "What Type?": z.string().optional(),
});

// Infer types from schemas
export type User = z.infer<typeof UserSchema>;
export type Job = z.infer<typeof JobSchema>;

// Job status type
export const JobStatus = z.enum([
  "pending",
  "claimed",
  "in_progress",
  "completed",
  "cancelled",
]);

export type JobStatusType = z.infer<typeof JobStatus>;
