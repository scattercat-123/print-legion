import type { FieldSet, Record } from "airtable";
import { usersTable, jobsTable } from ".";
import { JobSchema, UserSchema, type Job, type User } from "../types";

// Helper functions
export async function getById<T extends "job" | "user">(
  type: T,
  id: string
): Promise<((T extends "job" ? Job : User) & { id: string }) | null> {
  console.log(`[getById] ${type} ${id}`);
  try {
    let record: Record<FieldSet>;
    if (type === "user") {
      const records = await usersTable
        .select({
          filterByFormula: `{slack_id} = '${id}'`,
          maxRecords: 1,
        })
        .firstPage();

      if (records.length === 0 && type === "user") {
        await createBySlackId("user", { slack_id: id });
        return { slack_id: id, id: "" } as User & { id: string };
      }

      record = records[0];
    } else {
      record = await jobsTable.find(id);
    }

    const parsed = (type === "job" ? JobSchema : UserSchema).safeParse(
      record.fields
    );
    if (!parsed.success) {
      console.error("Failed to parse record:", parsed.error);
      return null;
    }
    return { ...parsed.data, id: record.id } as unknown as (T extends "job"
      ? Job
      : User) & {
      id: string;
    };
  } catch (error) {
    console.error("Error fetching record:", error);
    return null;
  }
}

export async function createBySlackId<T extends "job" | "user">(
  type: T,
  data: Partial<T extends "job" ? Job : User>
): Promise<{ success: boolean; id?: string }> {
  try {
    const table = type === "job" ? jobsTable : usersTable;
    const record = await table.create(data);
    return { success: true, id: record.id };
  } catch (error) {
    console.error("Error creating record:", error);
    return { success: false };
  }
}

export async function updateBySlackId<T extends "job" | "user">(
  type: T,
  id: string,
  data: Partial<T extends "job" ? Job : User>
) {
  try {
    let foundId: string;
    const table = type === "job" ? jobsTable : usersTable;

    if (type === "user") {
      const records = await table
        .select({
          filterByFormula: `{slack_id} = '${id}'`,
          maxRecords: 1,
        })
        .firstPage();

      if (records.length === 0) throw new Error("Record not found");

      const record = records[0];
      foundId = record.id;
    } else {
      foundId = id;
    }

    await table.update(foundId, data);
    return true;
  } catch (error) {
    console.error("Error updating record:", error);
    return false;
  }
}
