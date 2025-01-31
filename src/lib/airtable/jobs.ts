import { jobsTable } from ".";
import { JobSchema, type Job } from "../types";

// Search helper
export async function searchJobs({
  formula,
  offset = 0,
  maxRecords = 25,
}: {
  formula?: string;
  offset?: number;
  maxRecords?: number;
}) {
  try {
    const records = await jobsTable
      .select({
        filterByFormula: formula,
        offset,
        maxRecords,
      })
      .all();

    return records
      .map((record) => {
        const parsed = JobSchema.safeParse(record.fields);
        if (!parsed.success) {
          console.error("Failed to parse job record:", parsed.error.message);
          return null;
        }
        return { ...parsed.data, id: record.id };
      })
      .filter(Boolean) as (Job & { id: string })[];
  } catch (error) {
    console.error("Error searching jobs:", error);
    return [];
  }
}
