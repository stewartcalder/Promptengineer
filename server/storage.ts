import { type User, type InsertUser, type UploadedFile, type FileConversion, type InsertFile, type InsertConversion } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // File management
  createFile(file: InsertFile): Promise<UploadedFile>;
  getFile(id: string): Promise<UploadedFile | undefined>;
  getFilesBySession(sessionId: string): Promise<UploadedFile[]>;
  updateFileStatus(id: string, status: string): Promise<void>;
  deleteFile(id: string): Promise<void>;
  
  // Conversion management
  createConversion(conversion: InsertConversion): Promise<FileConversion>;
  getConversion(id: string): Promise<FileConversion | undefined>;
  getConversionsByFile(fileId: string): Promise<FileConversion[]>;
  updateConversion(id: string, updates: Partial<FileConversion>): Promise<void>;
  deleteConversion(id: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private files: Map<string, UploadedFile>;
  private conversions: Map<string, FileConversion>;

  constructor() {
    this.users = new Map();
    this.files = new Map();
    this.conversions = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createFile(insertFile: InsertFile): Promise<UploadedFile> {
    const id = randomUUID();
    const file: UploadedFile = { 
      ...insertFile, 
      id,
      status: insertFile.status || "pending",
      uploadedAt: new Date()
    };
    this.files.set(id, file);
    return file;
  }

  async getFile(id: string): Promise<UploadedFile | undefined> {
    return this.files.get(id);
  }

  async getFilesBySession(sessionId: string): Promise<UploadedFile[]> {
    return Array.from(this.files.values()).filter(
      (file) => file.sessionId === sessionId
    );
  }

  async updateFileStatus(id: string, status: string): Promise<void> {
    const file = this.files.get(id);
    if (file) {
      this.files.set(id, { ...file, status });
    }
  }

  async deleteFile(id: string): Promise<void> {
    this.files.delete(id);
    // Also delete associated conversions
    const conversions = Array.from(this.conversions.entries()).filter(
      ([_, conversion]) => conversion.fileId === id
    );
    conversions.forEach(([conversionId]) => {
      this.conversions.delete(conversionId);
    });
  }

  async createConversion(insertConversion: InsertConversion): Promise<FileConversion> {
    const id = randomUUID();
    const conversion: FileConversion = {
      ...insertConversion,
      id,
      status: insertConversion.status || "pending",
      jsonOutput: insertConversion.jsonOutput || null,
      tokenCount: insertConversion.tokenCount || null,
      error: insertConversion.error || null,
      createdAt: new Date()
    };
    this.conversions.set(id, conversion);
    return conversion;
  }

  async getConversion(id: string): Promise<FileConversion | undefined> {
    return this.conversions.get(id);
  }

  async getConversionsByFile(fileId: string): Promise<FileConversion[]> {
    return Array.from(this.conversions.values()).filter(
      (conversion) => conversion.fileId === fileId
    );
  }

  async updateConversion(id: string, updates: Partial<FileConversion>): Promise<void> {
    const conversion = this.conversions.get(id);
    if (conversion) {
      this.conversions.set(id, { ...conversion, ...updates });
    }
  }

  async deleteConversion(id: string): Promise<void> {
    this.conversions.delete(id);
  }
}

export const storage = new MemStorage();
