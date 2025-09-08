import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { randomUUID } from "crypto";
import * as path from "path";
import * as fs from "fs/promises";
import { storage } from "./storage";
import { FileProcessor } from "./services/fileProcessor";
import { TokenCounter } from "./services/tokenCounter";
import { insertFileSchema, insertConversionSchema } from "@shared/schema";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.docx', '.txt', '.md', '.csv', '.json', '.xml'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} not supported`));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  const fileProcessor = new FileProcessor();

  // Get all files for current session
  app.get("/api/files", async (req, res) => {
    try {
      const sessionId = req.sessionID;
      const files = await storage.getFilesBySession(sessionId);
      
      // Get conversions for each file
      const filesWithConversions = await Promise.all(
        files.map(async (file) => {
          const conversions = await storage.getConversionsByFile(file.id);
          const latestConversion = conversions.length > 0 
            ? conversions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
            : undefined;
          
          return {
            ...file,
            conversions,
            latestConversion
          };
        })
      );
      
      res.json(filesWithConversions);
    } catch (error) {
      console.error("Error fetching files:", error);
      res.status(500).json({ error: "Failed to fetch files" });
    }
  });

  // Upload files
  app.post("/api/files/upload", upload.array('files', 10), async (req, res) => {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      const sessionId = req.sessionID;
      const uploadedFiles = [];

      for (const file of req.files) {
        const fileExtension = path.extname(file.originalname).toLowerCase().substring(1);
        
        const fileData = insertFileSchema.parse({
          sessionId,
          filename: file.filename,
          originalName: file.originalname,
          fileType: fileExtension,
          fileSize: file.size,
          status: "uploaded"
        });

        const savedFile = await storage.createFile(fileData);
        uploadedFiles.push(savedFile);
      }

      res.json({ 
        message: "Files uploaded successfully", 
        files: uploadedFiles 
      });
    } catch (error) {
      console.error("Error uploading files:", error);
      res.status(500).json({ error: "Failed to upload files" });
    }
  });

  // Delete file
  app.delete("/api/files/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const file = await storage.getFile(id);
      
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }

      // Delete physical file
      try {
        await fs.unlink(path.join('uploads', file.filename));
      } catch (unlinkError) {
        console.warn("Could not delete physical file:", unlinkError);
      }

      // Delete from storage (this also deletes associated conversions)
      await storage.deleteFile(id);
      
      res.json({ message: "File deleted successfully" });
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(500).json({ error: "Failed to delete file" });
    }
  });

  // Process file conversion
  app.post("/api/files/:id/convert", async (req, res) => {
    try {
      const { id } = req.params;
      const { conversionType, includeTables, includeImages, preserveFormatting } = req.body;
      
      const file = await storage.getFile(id);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }

      // Create conversion record
      const conversionData = insertConversionSchema.parse({
        fileId: id,
        conversionType,
        options: {
          includeTables: Boolean(includeTables),
          includeImages: Boolean(includeImages),
          preserveFormatting: Boolean(preserveFormatting)
        },
        status: "processing"
      });

      const conversion = await storage.createConversion(conversionData);

      // Process file in background (in production, you'd use a job queue)
      setImmediate(async () => {
        try {
          await storage.updateFileStatus(id, "processing");
          
          const filePath = path.join('uploads', file.filename);
          const processedContent = await fileProcessor.processFile(
            filePath,
            file.originalName,
            file.fileType,
            {
              conversionType: conversionType as any,
              includeTables: Boolean(includeTables),
              includeImages: Boolean(includeImages),
              preserveFormatting: Boolean(preserveFormatting)
            }
          );

          const tokenCount = TokenCounter.estimateTokens(processedContent);

          await storage.updateConversion(conversion.id, {
            jsonOutput: processedContent,
            tokenCount,
            status: "completed"
          });

          await storage.updateFileStatus(id, "completed");
        } catch (error) {
          console.error("Error processing file:", error);
          await storage.updateConversion(conversion.id, {
            status: "error",
            error: error instanceof Error ? error.message : "Unknown error"
          });
          await storage.updateFileStatus(id, "error");
        }
      });

      res.json({ 
        message: "File conversion started",
        conversion: {
          ...conversion,
          jsonOutput: null,
          tokenCount: null
        }
      });
    } catch (error) {
      console.error("Error starting conversion:", error);
      res.status(500).json({ error: "Failed to start conversion" });
    }
  });

  // Get specific conversion
  app.get("/api/conversions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const conversion = await storage.getConversion(id);
      
      if (!conversion) {
        return res.status(404).json({ error: "Conversion not found" });
      }

      res.json(conversion);
    } catch (error) {
      console.error("Error fetching conversion:", error);
      res.status(500).json({ error: "Failed to fetch conversion" });
    }
  });

  // Get conversions for a file
  app.get("/api/files/:id/conversions", async (req, res) => {
    try {
      const { id } = req.params;
      const conversions = await storage.getConversionsByFile(id);
      res.json(conversions);
    } catch (error) {
      console.error("Error fetching conversions:", error);
      res.status(500).json({ error: "Failed to fetch conversions" });
    }
  });

  // Clear all files for session
  app.delete("/api/files", async (req, res) => {
    try {
      const sessionId = req.sessionID;
      const files = await storage.getFilesBySession(sessionId);
      
      // Delete physical files and database records
      await Promise.all(files.map(async (file) => {
        try {
          await fs.unlink(path.join('uploads', file.filename));
        } catch (unlinkError) {
          console.warn("Could not delete physical file:", unlinkError);
        }
        await storage.deleteFile(file.id);
      }));
      
      res.json({ message: "All files cleared successfully" });
    } catch (error) {
      console.error("Error clearing files:", error);
      res.status(500).json({ error: "Failed to clear files" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
