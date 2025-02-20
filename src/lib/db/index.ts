import * as schema from "./schema";

import "dotenv/config";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";

const db = drizzle(process.env.DB_FILE_NAME!, { schema });

// 6 hours in milliseconds
export const STATS_UPDATE_INTERVAL = 6 * 60 * 60 * 1000;

export async function shouldUpdateStats(): Promise<boolean> {
  const stats = await db.select().from(schema.globalStats).limit(1);
  if (stats.length === 0) return true;

  const lastUpdated = stats[0].lastUpdated;
  const now = new Date();
  return now.getTime() - lastUpdated.getTime() > STATS_UPDATE_INTERVAL;
}

export async function isCalculating(): Promise<boolean> {
  const stats = await db.select().from(schema.globalStats).limit(1);
  if (stats.length === 0) return false;
  return stats[0].isCalculating;
}

export async function setCalculating(calculating: boolean): Promise<void> {
  const stats = await db.select().from(schema.globalStats).limit(1);
  if (stats.length === 0) {
    await db.insert(schema.globalStats).values({
      lastUpdated: new Date(),
      isCalculating: calculating,
    });
  } else {
    await db
      .update(schema.globalStats)
      .set({ isCalculating: calculating })
      .where(eq(schema.globalStats.id, stats[0].id));
  }
}

export * from "./schema";
