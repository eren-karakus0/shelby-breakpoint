import { sqliteTable, text, integer, index, uniqueIndex } from "drizzle-orm/sqlite-core";

// Videos table for uploaded videos
export const videos = sqliteTable("videos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  fileId: text("file_id").notNull().unique(),
  account: text("account").notNull(),
  url: text("url").notNull(),
  description: text("description"),
  email: text("email"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
}, (table) => [
  index("videos_account_idx").on(table.account),
]);

export type Video = typeof videos.$inferSelect;
export type NewVideo = typeof videos.$inferInsert;

// Profiles table for user profile data
export const profiles = sqliteTable("profiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  walletAddress: text("wallet_address").notNull().unique(),
  username: text("username"),
  bio: text("bio"),
  email: text("email"),
  x_handle: text("x_handle"),
  marketingOptIn: integer("marketing_opt_in", { mode: "boolean" }).default(
    false
  ),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;

// Likes table for video likes
export const likes = sqliteTable("likes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  videoId: integer("video_id").notNull(),
  walletAddress: text("wallet_address").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
}, (table) => [
  uniqueIndex("likes_video_wallet_idx").on(table.videoId, table.walletAddress),
]);

export type Like = typeof likes.$inferSelect;
export type NewLike = typeof likes.$inferInsert;
