import { type PromptTemplate, type InsertPromptTemplate, type PromptExecution, type InsertPromptExecution } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Template management
  getTemplate(id: string): Promise<PromptTemplate | undefined>;
  getAllTemplates(): Promise<PromptTemplate[]>;
  createTemplate(template: InsertPromptTemplate): Promise<PromptTemplate>;
  updateTemplate(id: string, template: Partial<InsertPromptTemplate>): Promise<PromptTemplate | undefined>;
  deleteTemplate(id: string): Promise<boolean>;

  // Execution management
  getExecution(id: string): Promise<PromptExecution | undefined>;
  getAllExecutions(): Promise<PromptExecution[]>;
  createExecution(execution: InsertPromptExecution): Promise<PromptExecution>;
  updateExecution(id: string, execution: Partial<InsertPromptExecution>): Promise<PromptExecution | undefined>;
  deleteExecution(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private templates: Map<string, PromptTemplate>;
  private executions: Map<string, PromptExecution>;

  constructor() {
    this.templates = new Map();
    this.executions = new Map();
  }

  // Template management
  async getTemplate(id: string): Promise<PromptTemplate | undefined> {
    return this.templates.get(id);
  }

  async getAllTemplates(): Promise<PromptTemplate[]> {
    return Array.from(this.templates.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createTemplate(insertTemplate: InsertPromptTemplate): Promise<PromptTemplate> {
    const id = randomUUID();
    const template: PromptTemplate = {
      ...insertTemplate,
      id,
      createdAt: new Date(),
    };
    this.templates.set(id, template);
    return template;
  }

  async updateTemplate(id: string, updateData: Partial<InsertPromptTemplate>): Promise<PromptTemplate | undefined> {
    const existing = this.templates.get(id);
    if (!existing) return undefined;
    
    const updated: PromptTemplate = { ...existing, ...updateData };
    this.templates.set(id, updated);
    return updated;
  }

  async deleteTemplate(id: string): Promise<boolean> {
    return this.templates.delete(id);
  }

  // Execution management
  async getExecution(id: string): Promise<PromptExecution | undefined> {
    return this.executions.get(id);
  }

  async getAllExecutions(): Promise<PromptExecution[]> {
    return Array.from(this.executions.values()).sort(
      (a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime()
    );
  }

  async createExecution(insertExecution: InsertPromptExecution): Promise<PromptExecution> {
    const id = randomUUID();
    const execution: PromptExecution = {
      ...insertExecution,
      id,
      executedAt: new Date(),
    };
    this.executions.set(id, execution);
    return execution;
  }

  async updateExecution(id: string, updateData: Partial<InsertPromptExecution>): Promise<PromptExecution | undefined> {
    const existing = this.executions.get(id);
    if (!existing) return undefined;
    
    const updated: PromptExecution = { ...existing, ...updateData };
    this.executions.set(id, updated);
    return updated;
  }

  async deleteExecution(id: string): Promise<boolean> {
    return this.executions.delete(id);
  }
}

export const storage = new MemStorage();
