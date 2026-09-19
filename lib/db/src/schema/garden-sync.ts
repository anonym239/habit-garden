import { jsonb, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";

export const gardenSyncTable = pgTable("garden_sync", {
  userId: text("user_id").notNull(),
  platform: text("platform").notNull(),
  data: jsonb("data").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [primaryKey({ columns: [table.userId, table.platform] })]);

export type GardenSync = typeof gardenSyncTable.$inferSelect;