import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Table to store global stats that are shared across all users
export const globalStats = sqliteTable("global_stats", {
  id: integer("id").primaryKey().unique(),
  lastUpdated: integer("last_updated", { mode: "timestamp" }).notNull(),
  isCalculating: integer("is_calculating", { mode: "boolean" }).notNull().default(false),
  totalPrinters: integer("total_printers").notNull().default(0),
  totalUsers: integer("total_users").notNull().default(0),
  totalPrintJobs: integer("total_print_jobs").notNull().default(0),
  totalFilamentUsed: integer("total_filament_used").notNull().default(0),
});

// Table to store location points for quick radius calculations
export const locationPoints = sqliteTable("location_points", {
  userId: text("user_id").notNull().primaryKey().unique(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  isPrinter: integer("is_printer", { mode: "boolean" }).notNull(),
  countryCode: text("country_code").notNull(), // ISO3 code
  countryName: text("country_name").notNull(),
  countryFlagEmoji: text("country_flag_emoji").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Table to store country-level aggregations
export const countryStats = sqliteTable("country_stats", {
  countryCode: text("country_code").primaryKey().unique().notNull(), // ISO3 code
  countryName: text("country_name").notNull(),
  countryFlagEmoji: text("country_flag_emoji").notNull(),
  printerCount: integer("printer_count").notNull().default(0),
  userCount: integer("user_count").notNull().default(0),
  lastUpdated: integer("last_updated", { mode: "timestamp" }).notNull(),
});

// Table to store per-user radius stats
export const userRadiusStats = sqliteTable("user_radius_stats", {
  userId: text("user_id").primaryKey().unique().notNull(),
  radius5km: integer("radius_5km").notNull().default(0),
  radius25km: integer("radius_25km").notNull().default(0),
  radius50km: integer("radius_50km").notNull().default(0),
  lastUpdated: integer("last_updated", { mode: "timestamp" }).notNull(),
});
