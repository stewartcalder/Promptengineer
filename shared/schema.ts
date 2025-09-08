import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const promptTemplates = pgTable("prompt_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  systemPrompt: text("system_prompt"),
  messages: jsonb("messages").notNull(),
  parameters: jsonb("parameters").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const promptExecutions = pgTable("prompt_executions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id"),
  systemPrompt: text("system_prompt"),
  messages: jsonb("messages").notNull(),
  parameters: jsonb("parameters").notNull(),
  response: jsonb("response"),
  status: text("status").notNull(), // 'pending', 'success', 'error', 'rate_limited'
  inputTokens: integer("input_tokens"),
  outputTokens: integer("output_tokens"),
  cost: real("cost"),
  executedAt: timestamp("executed_at").defaultNow().notNull(),
});

// Zod schemas for validation
export const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.union([
    z.string(),
    z.array(z.object({
      type: z.enum(["text", "image"]),
      text: z.string().optional(),
      source: z.object({
        type: z.string(),
        media_type: z.string(),
        data: z.string(),
      }).optional(),
    }))
  ]),
});

export const parametersSchema = z.object({
  model: z.string().default("claude-sonnet-4-20250514"),
  max_tokens: z.number().min(1).max(8192).default(1024),
  temperature: z.number().min(0).max(1).default(0.7),
  top_k: z.number().min(1).max(100).optional(),
  stop_sequences: z.array(z.string()).optional(),
  tool_choice: z.enum(["auto", "any", "none"]).optional(),
  thinking: z.object({
    type: z.literal("enabled"),
    budget_tokens: z.number().min(1024),
  }).optional(),
});

export const insertPromptTemplateSchema = createInsertSchema(promptTemplates).omit({
  id: true,
  createdAt: true,
});

export const insertPromptExecutionSchema = createInsertSchema(promptExecutions).omit({
  id: true,
  executedAt: true,
});

export type PromptTemplate = typeof promptTemplates.$inferSelect;
export type InsertPromptTemplate = z.infer<typeof insertPromptTemplateSchema>;
export type PromptExecution = typeof promptExecutions.$inferSelect;
export type InsertPromptExecution = z.infer<typeof insertPromptExecutionSchema>;
export type Message = z.infer<typeof messageSchema>;
export type Parameters = z.infer<typeof parametersSchema>;
