import Airtable from "airtable";
import type { User, Job } from "./types";
import { UserSchema, JobSchema } from "./types";
import { z } from "zod";

if (!process.env.AIRTABLE_API_KEY) {
  throw new Error("Missing AIRTABLE_API_KEY");
}

if (!process.env.AIRTABLE_BASE_ID) {
  throw new Error("Missing AIRTABLE_BASE_ID");
}

// Initialize Airtable
const airtable = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY,
});

const base = airtable.base(process.env.AIRTABLE_BASE_ID);

// Table references
const jobsTable = base("Form");
const usersTable = base("Users");

// Helper functions
export async function getBySlackId<T extends "job" | "user">(
  type: T,
  slackId: string
): Promise<T extends "job" ? Job | null : User | null> {
  try {
    const table = type === "job" ? jobsTable : usersTable;
    const records = await table
      .select({
        filterByFormula: `{slack_id} = '${slackId}'`,
        maxRecords: 1,
      })
      .firstPage();

    if (records.length === 0 && type === "user") {
      await createBySlackId(type, { slack_id: slackId });
      return { slack_id: slackId } as User;
    };

    const record = records[0];

    const parsed = (type === "job" ? JobSchema : UserSchema).safeParse(
      record.fields
    );
    if (!parsed.success) {
      console.error("Failed to parse record:", parsed.error);
      return null;
    }
    return parsed.data as T extends "job" ? Job : User;
  } catch (error) {
    console.error("Error fetching record:", error);
    return null;
  }
}

export async function createBySlackId<T extends "job" | "user">(
  type: T,
  data: Partial<T extends "job" ? Job : User>
) {
  try {
    const table = type === "job" ? jobsTable : usersTable;
    await table.create(data);
    return true;
  } catch (error) {
    console.error("Error creating record:", error);
    return false;
  }
}

export async function updateBySlackId<T extends "job" | "user">(
  type: T,
  slackId: string,
  data: Partial<T extends "job" ? Job : User>
) {
  try {
    const table = type === "job" ? jobsTable : usersTable;
    const records = await table
      .select({
        filterByFormula: `{slack_id} = '${slackId}'`,
        maxRecords: 1,
      })
      .firstPage();

    if (records.length === 0) throw new Error("Record not found");

    const record = records[0];
    await table.update(record.id, data);
    return true;
  } catch (error) {
    console.error("Error updating record:", error);
    return false;
  }
}

// Pagination helper
export async function getUsers(page = 1, pageSize = 10) {
  try {
    const offset = (page - 1) * pageSize;
    const records = await usersTable
      .select({
        pageSize,
        offset,
      })
      .firstPage();

    return records
      .map((record) => {
        const parsed = UserSchema.safeParse(record.fields);
        if (!parsed.success) {
          console.error("Failed to parse user record:", parsed.error);
          return null;
        }
        return parsed.data;
      })
      .filter(Boolean) as User[];
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

// Search helper
export async function searchJobs(query?: string) {
  console.log(query);
  try {
    const records = await jobsTable
      .select({
        filterByFormula: query
          ? `OR(SEARCH("${query}", LOWER({slack_id})), SEARCH("${query}", LOWER({ysws})))`
          : "",
      })
      .firstPage();

    return records
      .map((record) => {
        const parsed = JobSchema.safeParse(record.fields);
        if (!parsed.success) {
          console.error("Failed to parse job record:", parsed.error.message);
          return null;
        }
        return parsed.data;
      })
      .filter(Boolean) as Job[];
  } catch (error) {
    console.error("Error searching jobs:", error);
    return [];
  }
}
