import { z } from "zod";

export const FilamentUsageSchema = z.object({
  grams: z.number().min(0),
  notes: z.string().optional(),
});

export const FulfillmentPhotoSchema = z.object({
  file: z.instanceof(File),
  description: z.string().optional(),
});

export type FilamentUsage = z.infer<typeof FilamentUsageSchema>;
export type FulfillmentPhoto = z.infer<typeof FulfillmentPhotoSchema>;

export interface StateButtonProps {
  jobId: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}
