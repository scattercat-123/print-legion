import type { FieldSet, Record } from "airtable";
import { usersTable, jobsTable } from ".";
import { JobSchema, UserSchema, type Job, type User } from "../types";
import { getDistance } from "../distance";

type GetByIdReturn<T extends "job" | "user", R extends boolean> = R extends true
  ? (T extends "job" ? Job : User) & { id: string; distance?: number }
  : ((T extends "job" ? Job : User) & { id: string; distance?: number }) | null;

// Helper functions
export async function getById<T extends "job" | "user", R extends boolean>(
  type: T,
  id: string | undefined,
  {
    includeSensitiveFields = false,
    coordinatesForDistance,
    throwOnNotFound = false as R,
  }: {
    includeSensitiveFields?: boolean;
    coordinatesForDistance?: string;
    throwOnNotFound?: R;
  } = {}
): Promise<GetByIdReturn<T, R>> {
  if (!id) {
    if (throwOnNotFound) {
      console.error(`[getById.error] ${type} not found: ${id}`);
      throw new Error(`not found`);
    }
    return null as GetByIdReturn<T, R>;
  }

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
        await createRecord("user", { slack_id: id });
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
      return null as GetByIdReturn<T, R>;
    }
    const final = { ...parsed.data, id: record.id };

    if (type === "job") {
      const coords = record.fields["(auto)(creator)region_coordinates"];
      if (
        coordinatesForDistance &&
        coords &&
        (coords as string[]).length >= 1
      ) {
        Object.assign(final, {
          distance: getDistance(
            coordinatesForDistance,
            (coords as string[])[0]
          ),
        });
      }

      if (!includeSensitiveFields) {
        (final as Job)["(auto)(creator)region_coordinates"] = undefined;
      }
    }

    return final as unknown as (T extends "job"
      ? Job & { distance?: number }
      : User) & {
      id: string;
    };
  } catch (error) {
    console.error("Error fetching record:", error);
    if (throwOnNotFound) {
      throw new Error(`${type} error fetching record: ${id} - ${error}`);
    }
    return null as GetByIdReturn<T, R>;
  }
}

export async function createRecord<T extends "job" | "user">(
  type: T,
  data: Partial<T extends "job" ? Job : User>
): Promise<{ success: boolean; id?: string }> {
  try {
    const table = type === "job" ? jobsTable : usersTable;
    const record = await table.create(data as Partial<FieldSet>);
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

    await table.update(foundId, data as Partial<FieldSet>);
    return true;
  } catch (error) {
    console.error("Error updating record:", error);
    return false;
  }
}
