import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, jsonb, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const uploadedFiles = pgTable("uploaded_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: text("session_id").notNull(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  status: text("status").notNull().default("pending"), // pending, processing, completed, error
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const fileConversions = pgTable("file_conversions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fileId: varchar("file_id").notNull().references(() => uploadedFiles.id, { onDelete: "cascade" }),
  conversionType: text("conversion_type").notNull(), // summary, full_content, metadata_only
  options: jsonb("options").notNull(), // { includeTables: boolean, includeImages: boolean, preserveFormatting: boolean }
  jsonOutput: jsonb("json_output"),
  tokenCount: integer("token_count"),
  status: text("status").notNull().default("pending"), // pending, processing, completed, error
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertFileSchema = createInsertSchema(uploadedFiles).omit({
  id: true,
  uploadedAt: true,
});

export const insertConversionSchema = createInsertSchema(fileConversions).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type UploadedFile = typeof uploadedFiles.$inferSelect;
export type FileConversion = typeof fileConversions.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;
export type InsertConversion = z.infer<typeof insertConversionSchema>;

// Frontend types for file processing
export interface ConversionOptions {
  conversionType: 'summary' | 'full_content' | 'metadata_only';
  includeTables: boolean;
  includeImages: boolean;
  preserveFormatting: boolean;
}

export interface ProcessedFile extends UploadedFile {
  conversions: FileConversion[];
  latestConversion?: FileConversion;
}
