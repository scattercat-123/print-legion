import { usersTable } from ".";
import { UserSchema, type User } from "../types";

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
        return { ...parsed.data, id: record.id };
      })
      .filter(Boolean) as (User & { id: string })[];
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}
