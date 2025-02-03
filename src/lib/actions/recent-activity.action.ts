"use server";
import "server-only";
import { jobsTable } from "@/lib/airtable";
import { auth } from "@/lib/auth";
import { Job, JobSchema } from "@/lib/types";

export async function getRecentActivity(): Promise<
  | {
      recentJobs: (Job & { id: string })[];
      stats: {
        lastHourModifications: number;
        totalActiveJobs: number;
        totalCompletedJobs: number;
      };
    }
  | {
      error: string;
    }
> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const formattedDate = oneHourAgo.toISOString();

    // Get recent jobs and count modifications

    // Get stats
    const [records, activeJobs, completedJobs] = await Promise.all([
      jobsTable
        .select({
          filterByFormula: `AND(IS_AFTER({last_modified}, '${formattedDate}'),OR({(auto)(assigned_printer)slack_id} = '${session.user.id}',{(auto)(creator)slack_id} = '${session.user.id}'))`,
          sort: [{ field: "last_modified", direction: "desc" }],
          maxRecords: 5,
        })
        .all(),
      jobsTable
        .select({
          filterByFormula: `AND({status} = 'in_progress',{(auto)(assigned_printer)slack_id} = '${session.user.id}')`,
          maxRecords: 0,
        })
        .all(),
      jobsTable
        .select({
          filterByFormula: `AND({status} = 'done',{(auto)(assigned_printer)slack_id} = '${session.user.id}')`,
          maxRecords: 0,
        })
        .all(),
    ]);

    const recentJobs = records
      .map((record) => {
        const parsed = JobSchema.safeParse(record.fields);
        if (!parsed.success) {
          console.error("Failed to parse job record:", parsed.error.message);
          return null;
        }
        return { ...parsed.data, id: record.id };
      })
      .filter(Boolean) as (Job & { id: string })[];

    return {
      recentJobs,
      stats: {
        lastHourModifications: records.length,
        totalActiveJobs: activeJobs.length,
        totalCompletedJobs: completedJobs.length,
      },
    };
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    return {
      error: "Failed to fetch recent activity",
    };
  }
}
