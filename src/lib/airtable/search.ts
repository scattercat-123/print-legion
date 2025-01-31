import type { Record } from "airtable";
import { jobsTable } from "./shared";
import type { Job } from "@/lib/types";

interface SearchJobsOptions {
  query: string;
  mode?: "formula" | "filter";
}

export async function searchJobs({
  query,
  mode = "filter",
}: SearchJobsOptions) {
  try {
    const records = await jobsTable
      .select({
        [mode === "formula" ? "filterByFormula" : "filterByFormula"]: query,
      })
      .firstPage();

    return records.map((record: Record<any>) => ({
      id: record.id,
      ...record.fields,
    })) as Job[];
  } catch (error) {
    console.error("Error searching jobs:", error);
    return [];
  }
}

export async function searchJobsByCreator(creatorId: string) {
  return searchJobs({
    query: `{creator} = '${creatorId}'`,
    mode: "formula",
  });
}

export async function searchJobsByPrinter(printerId: string) {
  return searchJobs({
    query: `{assigned_printer} = '${printerId}'`,
    mode: "formula",
  });
}

export async function searchJobsByStatus(status: string) {
  return searchJobs({
    query: `{status} = '${status}'`,
    mode: "formula",
  });
}
