import { JOBS_TABLE_NAME } from ".";
import { JobSchema, type Job } from "../types";

// Search helper
export async function searchJobs({
  formula,
  offset,
  pageSize = 50,
}: {
  formula?: string;
  offset?: string;
  pageSize?: number;
}) {
  try {
    const base_url = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}`;
    const query = new URLSearchParams();
    if (formula) query.set("filterByFormula", formula);
    if (offset) query.set("offset", offset);
    if (pageSize) query.set("pageSize", pageSize.toString());

    const records = await fetch(`${base_url}/${JOBS_TABLE_NAME}?${query.toString()}`, {
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
      },
    });

    const json = await records.json();

    return {
      data: json.records
        .map((record: any) => {
          const parsed = JobSchema.safeParse(record.fields);
          if (!parsed.success) {
            console.error("Failed to parse job record:", parsed.error.message);
            return null;
          }
          return { ...parsed.data, id: record.id };
        })
        .filter(Boolean) as (Job & { id: string })[],
      offset: json.offset ?? undefined,
    };
  } catch (error) {
    console.error("Error searching jobs:", error);
    return {
      data: [],
      offset: undefined,
    };
  }
}
