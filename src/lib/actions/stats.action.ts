"use server";
import "server-only";
import { auth } from "../auth";
import { drizzle } from "drizzle-orm/libsql";
import { eq } from "drizzle-orm";
import * as schema from "../db/schema";
import { getById, searchAll } from "../airtable";
import { getDistance } from "../distance";
import { User } from "../types";
import { GLOBAL_STAT_ID } from "../consts";
import { feature } from "@rapideditor/country-coder";

const db = drizzle(process.env.DB_FILE_NAME!, { schema });

export type GlobalStats = {
  lastUpdated: Date;
  isCalculating: boolean;
  totalPrinters: number;
  totalUsers: number;
  totalPrintJobs: number;
  totalFilamentUsed: number;
  countryStats: Array<{
    countryFlagEmoji: string;
    countryCode: string;
    countryName: string;
    printerCount: number;
    userCount: number;
  }>;
  userStats?: {
    radius5km: number;
    radius25km: number;
    radius50km: number;
  };
};

export async function getStats(): Promise<GlobalStats> {
  console.log("[getStats] Starting stats fetch");
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  await calculateStats(false);

  const stats = await db.select().from(schema.globalStats).where(eq(schema.globalStats.id, GLOBAL_STAT_ID));

  // Get country stats
  const countryStats = await db.select().from(schema.countryStats);
  console.log("[getStats] Country stats count:", countryStats.length);

  // Get user stats if they have location
  const user = await getById("user", session.user.id);
  console.log("[getStats] User location:", user?.region_coordinates);
  let userStats = undefined;

  if (user?.region_coordinates) {
    const userStatsData = await db
      .select()
      .from(schema.userRadiusStats)
      .where(eq(schema.userRadiusStats.userId, session.user.id))
      .limit(1);

    console.log("[getStats] User radius stats:", userStatsData[0] ?? "none");
    if (userStatsData.length > 0) {
      userStats = {
        radius5km: userStatsData[0].radius5km,
        radius25km: userStatsData[0].radius25km,
        radius50km: userStatsData[0].radius50km,
      };
    }
  }

  const globalStats = stats[0];

  return {
    ...globalStats,
    countryStats,
    userStats,
  };
}

export async function calculateStats(force = false) {
  console.log("[calculateStats] Starting stats calculation");
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  // Check if we should update
  const stats = await db.select().from(schema.globalStats).limit(1);
  console.log("[calculateStats] Current stats:", stats[0] ?? "none");

  if (stats.length === 0) {
    console.log("[calculateStats] Initializing stats table");
    await db.insert(schema.globalStats).values({
      id: GLOBAL_STAT_ID,
      lastUpdated: new Date(),
      isCalculating: false,
      totalPrinters: 0,
      totalUsers: 0,
    });
  }

  // Check if we should update
  const now = new Date();
  const lastUpdated = stats[0]?.lastUpdated ?? new Date(0);
  const timeSinceUpdate = now.getTime() - lastUpdated.getTime();
  console.log("[calculateStats] Time since last update (ms):", timeSinceUpdate);

  if (timeSinceUpdate <= 6 * 60 * 60 * 1000 && !force) {
    console.log("[calculateStats] Skipping update - too soon");
    return;
  }

  // Check if already calculating
  if (stats[0]?.isCalculating) {
    console.log("[calculateStats] Already calculating, skipping");
    return;
  }

  // Set calculating flag
  console.log("[calculateStats] Setting calculating flag");
  await db
    .insert(schema.globalStats)
    .values({
      id: GLOBAL_STAT_ID,
      lastUpdated: new Date(),
      isCalculating: true,
    })
    .onConflictDoUpdate({
      target: [schema.globalStats.id],
      set: {
        isCalculating: true,
      },
    });

  try {
    // Clear existing location points
    console.log("[calculateStats] Clearing existing location points");
    await db.delete(schema.locationPoints);

    // Fetch all users from Airtable
    console.log("[calculateStats] Fetching users from Airtable");
    const { data: users } = await searchAll({
      table: "users",
      formula: "NOT({region_coordinates} = '')",
    });
    console.log("[calculateStats] Found users with locations:", users.length);

    // Insert location points with country info
    const locationPoints = users
      .filter((user): user is User & { id: string } => Boolean(user.region_coordinates))
      .map((user) => {
        const [lat, lon] = user.region_coordinates!.split(",").map(Number);
        const country = feature([lon, lat]); // Note: country-coder expects [lon, lat]

        if (!country?.properties?.iso1A3 || !country.properties.nameEn) {
          console.warn("[calculateStats] Invalid country data for coordinates:", user.region_coordinates);
          return null;
        }

        return {
          userId: user.slack_id,
          latitude: lat,
          longitude: lon,
          isPrinter: user.printer_has ?? false,
          countryCode: country.properties.iso1A3,
          countryName: country.properties.nameEn,
          countryFlagEmoji: country.properties.emojiFlag ?? "",
          createdAt: new Date(),
        };
      })
      .filter((point): point is NonNullable<typeof point> => Boolean(point));

    console.log("[calculateStats] Processed location points:", locationPoints.length);
    if (locationPoints.length > 0) {
      await db.insert(schema.locationPoints).values(locationPoints);
    }

    // Calculate country stats
    console.log("[calculateStats] Calculating country stats");
    const countryStats = await db
      .select({
        countryCode: schema.locationPoints.countryCode,
        countryName: schema.locationPoints.countryName,
        countryFlagEmoji: schema.locationPoints.countryFlagEmoji,
        isPrinter: schema.locationPoints.isPrinter,
      })
      .from(schema.locationPoints);

    // Group by country
    const countryGroups = new Map<string, { name: string; printers: number; users: number; flagEmoji: string }>();
    for (const stat of countryStats) {
      const current = countryGroups.get(stat.countryCode) ?? {
        name: stat.countryName,
        flagEmoji: stat.countryFlagEmoji,
        printers: 0,
        users: 0,
      };
      if (stat.isPrinter) current.printers++;
      current.users++;
      countryGroups.set(stat.countryCode, current);
    }

    console.log("[calculateStats] Country groups:", Object.fromEntries(countryGroups));

    // Clear existing country stats
    console.log("[calculateStats] Clearing existing country stats");
    await db.delete(schema.countryStats);

    // Insert new country stats
    if (countryGroups.size > 0) {
      console.log("[calculateStats] Inserting new country stats");
      await db.insert(schema.countryStats).values(
        Array.from(countryGroups.entries()).map(([code, stats]) => ({
          countryCode: code,
          countryName: stats.name,
          countryFlagEmoji: stats.flagEmoji,
          printerCount: stats.printers,
          userCount: stats.users,
          lastUpdated: new Date(),
        })),
      );
    }

    // Calculate per-user radius stats
    console.log("[calculateStats] Calculating per-user radius stats");
    await db.delete(schema.userRadiusStats);

    // For each user with location
    for (const user of users.filter((u): u is User & { id: string } => Boolean(u.region_coordinates))) {
      const userCoords = user.region_coordinates!;
      const radiusStats = {
        userId: user.slack_id,
        radius5km: 0,
        radius25km: 0,
        radius50km: 0,
        lastUpdated: new Date(),
      };

      // Count printers in each radius
      for (const point of locationPoints) {
        if (!point.isPrinter) continue;
        const distance = getDistance(userCoords, `${point.latitude},${point.longitude}`);
        if (distance <= 5) radiusStats.radius5km++;
        if (distance <= 25) radiusStats.radius25km++;
        if (distance <= 50) radiusStats.radius50km++;
      }

      console.log("[calculateStats] User radius stats for", user.slack_id, ":", radiusStats);
      await db.insert(schema.userRadiusStats).values(radiusStats);
    }

    console.log("[calculateStats] Calculating total print jobs and filament used");
    const { data: jobs } = await searchAll({
      table: "jobs",
      formula: "",
    });
    console.log("[calculateStats] Found jobs:", jobs.length);
    const totalFilamentUsed = jobs.reduce((acc, job) => acc + (job.filament_used ?? 0), 0);

    // Update global stats
    console.log("[calculateStats] Updating global stats");
    await db
      .update(schema.globalStats)
      .set({
        lastUpdated: new Date(),
        totalPrinters: locationPoints.filter((p) => p.isPrinter).length,
        totalUsers: locationPoints.length,
        totalPrintJobs: jobs.length,
        totalFilamentUsed,
      })
      .where(eq(schema.globalStats.id, GLOBAL_STAT_ID));

    console.log("[calculateStats] Stats calculation completed successfully");
  } catch (error) {
    console.error("[calculateStats] Error during calculation:", error);
    throw error;
  } finally {
    console.log("[calculateStats] Resetting calculating flag");
    await db.update(schema.globalStats).set({ isCalculating: false }).where(eq(schema.globalStats.id, GLOBAL_STAT_ID));
  }
}
