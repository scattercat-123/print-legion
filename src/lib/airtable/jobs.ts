import { jobsTable } from ".";
import { JobSchema, type Job } from "../types";

// Search helper
export async function searchJobs({
  query,
  mode = "search",
  offset = 0,
  maxRecords = 25,
}: {
  query?: string;
  mode?: "search" | "formula";
  offset?: number;
  maxRecords?: number;
}) {
  const _query = query?.toLowerCase().trim();
  try {
    const records = await jobsTable
      .select({
        filterByFormula:
          mode === "search"
            ? `OR(
            SEARCH("${_query}", LOWER({item_name})),
            SEARCH("${_query}", LOWER({item_description})),
            SEARCH("${_query}", LOWER({ysws_pr_url})),
            SEARCH("${_query}", LOWER(ARRAYJOIN({(auto)(creator)slack_id})))
            )`
            : query,
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
