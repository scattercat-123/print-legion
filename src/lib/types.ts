import { z } from "zod";

export const JobStatus = z.enum([
  "needs_printer", // Initial state after submission
  "claimed", // Printer has claimed but not started
  "printing_in_progress", // Printing has started
  "completed_printing", // Printing finished, awaiting fulfillment
  "fulfilled_awaiting_confirmation", // Fulfillment done, awaiting confirmation from submitter
  "finished", // All done
  "cancelled", // Cancelled by submitter
]);

const AirtableReferenceSchema = z.array(z.string()).optional();

const ThumbnailSchema = z
  .object({
    url: z.string().url(),
    width: z.number(),
    height: z.number(),
  })
  .optional();

export const AirtableAttachmentSchema = z.object({
  id: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
  url: z.string().url(),
  filename: z.string(),
  size: z.number(),
  type: z.string(),
  thumbnails: z
    .object({
      small: ThumbnailSchema,
      large: ThumbnailSchema,
      full: ThumbnailSchema,
    })
    .optional(),
});

// User table schema
export const JobSchema = z.object({
  creator: AirtableReferenceSchema, // e.g., ["rect0PI1RBEOvQee0"]
  "(auto)(creator)slack_id": z.array(z.string()).optional(),
  "(auto)(creator)region_coordinates": z
    .array(z.string().regex(/^-?\d{1,2}\.\d{1,8},-?\d{1,2}\.\d{1,8}$/))
    .optional(),

  ysws: AirtableReferenceSchema, // e.g., ["rect0PI1RBEOvQee0"]
  "(auto)(ysws)name": z.array(z.string()).optional(), // e.g., ["Hackpad"]
  need_printed_parts: z.boolean().default(true).optional(),
  part_count: z.number().optional(),
  stls: z.array(AirtableAttachmentSchema).optional(), // Airtable attachments
  user_images: z.array(AirtableAttachmentSchema).optional(), // Airtable attachments
  ysws_pr_url: z.string().optional(),

  assigned_printer: AirtableReferenceSchema, // e.g., ["rect0PI1RBEOvQee0"]
  "(auto)(assigned_printer)slack_id": z.array(z.string()).optional(),

  status: JobStatus.optional(),
  item_name: z.string().optional(),
  item_description: z.string().optional(),
  last_modified: z.string().optional(),

  main_image_id: z.string().optional(),
  main_stl_id: z.string().optional(),

  // Filament usage tracking
  filament_used: z.number().optional(),
  printing_notes: z.string().optional(),

  fulfilment_photo: z.array(AirtableAttachmentSchema).optional(),
  gcode_files: z.array(AirtableAttachmentSchema).optional(),
});

// Printer table schema
export const UserSchema = z.object({
  slack_id: z.string(),
  printer_has: z.boolean().default(false).optional(),
  printer_type: z.string().optional(),
  printer_details: z.string().optional(),
  preferred_ysws: z.array(z.string()).optional(),
  onboarded: z.boolean().default(false).optional(),
  has_ever_submitted: z.boolean().default(false).optional(),
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
