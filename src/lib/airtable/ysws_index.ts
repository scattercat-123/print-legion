"use server";

import { yswsIndexTable } from ".";
import { YSWSIndexSchema, type YSWSIndex } from "../types";

// Pagination helper
export async function getAll_YSWS() {
  try {
    const records = await yswsIndexTable.select().all();

    return records
      .map((record) => {
        const parsed = YSWSIndexSchema.safeParse(record.fields);
        if (!parsed.success) {
          console.error("Failed to parse YSWS record:", parsed.error);
          return null;
        }
        return { ...parsed.data, id: record.id };
      })
      .filter(Boolean) as (YSWSIndex & { id: string })[];
  } catch (error) {
    console.error("Error fetching all YSWSes:", error);
    return [];
  }
}

export async function getYSWSbyId(id: string) {
  const record = await yswsIndexTable.find(id);
  const parsed = YSWSIndexSchema.safeParse(record.fields);
  if (!parsed.success) {
    console.error("Failed to parse YSWS record:", parsed.error);
    return null;
  }
  return { ...parsed.data, id: record.id } as YSWSIndex & { id: string };
}
