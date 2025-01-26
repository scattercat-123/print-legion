import { z } from "zod";

export const JobStatus = z.enum(["in_progress", "done", "cancelled"]);

// User table schema
export const JobSchema = z.object({
  slack_id: z.string(),
  ysws: z.array(z.string()).optional(), // e.g., ["rect0PI1RBEOvQee0"]
  "(auto)ysws_name": z.array(z.string()).optional(), // e.g., ["Hackpad"]
  need_printed_parts: z.boolean().default(true).optional(),
  part_count: z.number().optional(),
  stls: z.array(z.any()).optional(), // Airtable attachments
  ysws_pr_url: z.string().optional(),
  assigned_printer_id: z.string().optional(),
  status: JobStatus.optional(),
});

// Printer table schema
export const UserSchema = z.object({
  slack_id: z.string(),
  printer_has: z.boolean().default(false).optional(),
  printer_type: z.string().optional(),
  printer_details: z.string().optional(),
  available_ysws: z.array(z.string()).optional(),
  onboarded: z.boolean().default(false).optional(),
  // lat,lon e.g "40.7128,-74.0060"
  region_coordinates: z
    .string()
    .regex(/^-?\d{1,2}\.\d{1,8},-?\d{1,2}\.\d{1,8}$/)
    .optional(),
});

export const YSWSIndexSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  homepage_url: z.string().url().optional(),
  logo: z.array(z.any()).optional(),
});

// Infer types from schemas
export type User = z.infer<typeof UserSchema>;
export type Job = z.infer<typeof JobSchema>;
export type YSWSIndex = z.infer<typeof YSWSIndexSchema>;
// Job status type

export type JobStatusType = z.infer<typeof JobStatus>;
