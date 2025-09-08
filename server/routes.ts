import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPromptTemplateSchema, insertPromptExecutionSchema, parametersSchema, messageSchema } from "@shared/schema";
import { executeAnthropicPrompt } from "./services/anthropic";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Template routes
  app.get("/api/templates", async (req, res) => {
    try {
      const templates = await storage.getAllTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  app.get("/api/templates/:id", async (req, res) => {
    try {
      const template = await storage.getTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch template" });
    }
  });

  app.post("/api/templates", async (req, res) => {
    try {
      const templateData = insertPromptTemplateSchema.parse(req.body);
      const template = await storage.createTemplate(templateData);
      res.json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid template data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create template" });
    }
  });

  app.put("/api/templates/:id", async (req, res) => {
    try {
      const templateData = insertPromptTemplateSchema.partial().parse(req.body);
      const template = await storage.updateTemplate(req.params.id, templateData);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid template data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update template" });
    }
  });

  app.delete("/api/templates/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteTemplate(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Template not found" });
      }
      res.json({ message: "Template deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete template" });
    }
  });

  // Execution routes
  app.get("/api/executions", async (req, res) => {
    try {
      const executions = await storage.getAllExecutions();
      res.json(executions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch executions" });
    }
  });

  app.get("/api/executions/:id", async (req, res) => {
    try {
      const execution = await storage.getExecution(req.params.id);
      if (!execution) {
        return res.status(404).json({ message: "Execution not found" });
      }
      res.json(execution);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch execution" });
    }
  });

  app.delete("/api/executions/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteExecution(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Execution not found" });
      }
      res.json({ message: "Execution deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete execution" });
    }
  });

  // Execute prompt
  app.post("/api/execute", async (req, res) => {
    try {
      const executeSchema = z.object({
        systemPrompt: z.string().optional(),
        messages: z.array(messageSchema).min(1),
        parameters: parametersSchema,
        templateId: z.string().optional(),
      });

      const { systemPrompt, messages, parameters, templateId } = executeSchema.parse(req.body);

      // Create execution record
      const executionData = {
        templateId,
        systemPrompt,
        messages,
        parameters,
        response: null,
        status: "pending" as const,
        inputTokens: null,
        outputTokens: null,
        cost: null,
      };

      const execution = await storage.createExecution(executionData);

      try {
        // Execute the prompt
        const response = await executeAnthropicPrompt({
          systemPrompt,
          messages,
          parameters,
        });

        // Update execution with response
        await storage.updateExecution(execution.id, {
          status: "success",
          response: response,
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          cost: calculateCost(parameters.model, response.usage),
        });

        res.json({
          executionId: execution.id,
          response,
          usage: response.usage,
          cost: calculateCost(parameters.model, response.usage),
        });
      } catch (apiError: any) {
        const status = apiError.status === 429 ? "rate_limited" : "error";
        await storage.updateExecution(execution.id, {
          status,
          response: { error: apiError.message },
        });

        res.status(apiError.status || 500).json({
          executionId: execution.id,
          message: "API request failed",
          error: apiError.message,
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to execute prompt" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Cost calculation based on Anthropic pricing (as of 2025)
function calculateCost(model: string, usage: { input_tokens: number; output_tokens: number }): number {
  const pricing: { [key: string]: { input: number; output: number } } = {
    "claude-opus-4-1-20250805": { input: 15, output: 75 },
    "claude-sonnet-4-20250514": { input: 3, output: 15 },
    "claude-3-5-sonnet-20241022": { input: 3, output: 15 },
    "claude-3-haiku-20240307": { input: 0.25, output: 1.25 },
  };

  const modelPricing = pricing[model] || pricing["claude-sonnet-4-20250514"];
  const inputCost = (usage.input_tokens / 1000000) * modelPricing.input;
  const outputCost = (usage.output_tokens / 1000000) * modelPricing.output;
  
  return Math.round((inputCost + outputCost) * 100000) / 100000; // Round to 5 decimal places
}
