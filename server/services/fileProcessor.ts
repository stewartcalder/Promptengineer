import * as fs from 'fs/promises';
import * as path from 'path';
import { createReadStream } from 'fs';
import csv from 'csv-parser';
import mammoth from 'mammoth';

// Type definitions for different file processors
export interface ProcessingOptions {
  conversionType: 'summary' | 'full_content' | 'metadata_only';
  includeTables: boolean;
  includeImages: boolean;
  preserveFormatting: boolean;
}

export interface ProcessedContent {
  document_type: string;
  filename: string;
  processed_at: string;
  conversion_type: string;
  metadata: Record<string, any>;
  content: Record<string, any>;
}

export class FileProcessor {
  
  async processFile(filePath: string, filename: string, fileType: string, options: ProcessingOptions): Promise<ProcessedContent> {
    const baseResult: ProcessedContent = {
      document_type: fileType.toLowerCase(),
      filename,
      processed_at: new Date().toISOString(),
      conversion_type: options.conversionType,
      metadata: {},
      content: {}
    };

    try {
      switch (fileType.toLowerCase()) {
        case 'pdf':
          return await this.processPDF(filePath, baseResult, options);
        case 'docx':
          return await this.processDOCX(filePath, baseResult, options);
        case 'txt':
        case 'md':
          return await this.processText(filePath, baseResult, options);
        case 'csv':
          return await this.processCSV(filePath, baseResult, options);
        case 'json':
          return await this.processJSON(filePath, baseResult, options);
        case 'xml':
          return await this.processXML(filePath, baseResult, options);
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
        case 'bmp':
        case 'webp':
          return await this.processImage(filePath, baseResult, options);
        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }
    } catch (error) {
      throw new Error(`Failed to process ${fileType} file: ${error}`);
    }
  }

  private async processPDF(filePath: string, baseResult: ProcessedContent, options: ProcessingOptions): Promise<ProcessedContent> {
    const buffer = await fs.readFile(filePath);
    const stats = await fs.stat(filePath);
    
    try {
      // Dynamically import pdf-parse to avoid initialization issues
      const { default: pdfParse } = await import('pdf-parse');
      const data = await pdfParse(buffer);
      
      // Extract metadata
      baseResult.metadata = {
        file_size: stats.size,
        pages: data.numpages,
        created_date: stats.birthtime.toISOString().split('T')[0],
        word_count: data.text.split(/\s+/).filter(word => word.length > 0).length,
        character_count: data.text.length
      };

      // Add PDF-specific metadata if available
      if (data.info) {
        baseResult.metadata = {
          ...baseResult.metadata,
          title: data.info.Title || undefined,
          author: data.info.Author || undefined,
          subject: data.info.Subject || undefined,
          creator: data.info.Creator || undefined,
          producer: data.info.Producer || undefined,
          creation_date: data.info.CreationDate || undefined,
          modification_date: data.info.ModDate || undefined
        };
      }

      // Process content based on conversion type
      if (options.conversionType === 'summary') {
        const words = data.text.split(/\s+/).filter(word => word.length > 0);
        const lines = data.text.split('\n').filter(line => line.trim().length > 0);
        
        // Extract first and last paragraphs for summary
        const paragraphs = data.text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
        const firstParagraphs = paragraphs.slice(0, 3);
        const lastParagraphs = paragraphs.slice(-2);
        
        baseResult.content = {
          summary: `PDF document with ${data.numpages} pages containing ${words.length} words across ${lines.length} lines.`,
          first_paragraphs: firstParagraphs,
          last_paragraphs: lastParagraphs,
          key_statistics: {
            pages: data.numpages,
            words: words.length,
            lines: lines.length,
            paragraphs: paragraphs.length
          }
        };
      } else if (options.conversionType === 'full_content') {
        const paragraphs = data.text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
        const lines = data.text.split('\n');
        
        baseResult.content = {
          full_text: data.text,
          paragraphs: paragraphs,
          lines: options.preserveFormatting ? lines : lines.map(line => line.trim()).filter(line => line.length > 0),
          formatting: options.preserveFormatting ? "preserved" : "cleaned"
        };
      } else { // metadata_only
        baseResult.content = {
          structure: {
            document_type: "PDF",
            pages: data.numpages,
            has_text: data.text.length > 0,
            estimated_reading_time_minutes: Math.ceil(baseResult.metadata.word_count / 200)
          }
        };
      }

      return baseResult;
    } catch (error) {
      throw new Error(`Failed to parse PDF: ${error}`);
    }
  }

  private async processDOCX(filePath: string, baseResult: ProcessedContent, options: ProcessingOptions): Promise<ProcessedContent> {
    const buffer = await fs.readFile(filePath);
    const stats = await fs.stat(filePath);
    
    try {
      // Extract both text and HTML for different formatting options
      const textResult = await mammoth.extractRawText({ buffer });
      const htmlResult = options.preserveFormatting ? await mammoth.convertToHtml({ buffer }) : null;
      
      const plainText = textResult.value;
      const words = plainText.split(/\s+/).filter(word => word.length > 0);
      const lines = plainText.split('\n').filter(line => line.trim().length > 0);
      
      // Extract metadata
      baseResult.metadata = {
        file_size: stats.size,
        word_count: words.length,
        character_count: plainText.length,
        line_count: lines.length,
        created_date: stats.birthtime.toISOString().split('T')[0],
        has_formatting: options.preserveFormatting && htmlResult ? htmlResult.value.length > plainText.length : false
      };

      // Add conversion warnings/messages if any
      if (textResult.messages && textResult.messages.length > 0) {
        baseResult.metadata.conversion_messages = textResult.messages.map(msg => msg.message);
      }

      // Process content based on conversion type
      if (options.conversionType === 'summary') {
        // Split into paragraphs for better summary
        const paragraphs = plainText.split(/\n\s*\n/).filter(p => p.trim().length > 0);
        const firstParagraphs = paragraphs.slice(0, 3);
        const lastParagraphs = paragraphs.slice(-2);
        
        // Try to identify potential sections (lines that might be headings)
        const potentialHeadings = lines.filter(line => {
          const trimmed = line.trim();
          return trimmed.length < 100 && // Short lines
                 trimmed.split(' ').length <= 8 && // Few words
                 !trimmed.endsWith('.') && // Don't end with period
                 trimmed.length > 3; // Not too short
        });

        baseResult.content = {
          summary: `Word document with ${words.length} words across ${paragraphs.length} paragraphs.`,
          first_paragraphs: firstParagraphs,
          last_paragraphs: lastParagraphs,
          potential_sections: potentialHeadings.slice(0, 10),
          key_statistics: {
            words: words.length,
            paragraphs: paragraphs.length,
            lines: lines.length,
            estimated_pages: Math.ceil(words.length / 250)
          }
        };
      } else if (options.conversionType === 'full_content') {
        const paragraphs = plainText.split(/\n\s*\n/).filter(p => p.trim().length > 0);
        
        baseResult.content = {
          full_text: plainText,
          paragraphs: paragraphs,
          lines: lines,
          formatting: options.preserveFormatting ? "preserved" : "plain"
        };

        // Include HTML if formatting is preserved
        if (options.preserveFormatting && htmlResult) {
          baseResult.content.html_content = htmlResult.value;
        }
      } else { // metadata_only
        baseResult.content = {
          structure: {
            document_type: "DOCX",
            has_text: plainText.length > 0,
            estimated_reading_time_minutes: Math.ceil(words.length / 200),
            estimated_pages: Math.ceil(words.length / 250)
          }
        };
      }

      return baseResult;
    } catch (error) {
      throw new Error(`Failed to parse DOCX: ${error}`);
    }
  }

  private async processText(filePath: string, baseResult: ProcessedContent, options: ProcessingOptions): Promise<ProcessedContent> {
    const content = await fs.readFile(filePath, 'utf-8');
    const stats = await fs.stat(filePath);
    
    baseResult.metadata = {
      file_size: stats.size,
      line_count: content.split('\n').length,
      word_count: content.split(/\s+/).length,
      character_count: content.length
    };

    if (options.conversionType === 'summary') {
      const lines = content.split('\n').filter(line => line.trim());
      baseResult.content = {
        summary: `Text file with ${lines.length} lines of content.`,
        first_lines: lines.slice(0, 5),
        last_lines: lines.slice(-5)
      };
    } else if (options.conversionType === 'full_content') {
      baseResult.content = {
        full_text: content,
        lines: content.split('\n')
      };
    }

    return baseResult;
  }

  private async processCSV(filePath: string, baseResult: ProcessedContent, options: ProcessingOptions): Promise<ProcessedContent> {
    const rows: any[] = [];
    const stats = await fs.stat(filePath);
    
    return new Promise((resolve, reject) => {
      createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => rows.push(data))
        .on('end', () => {
          const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
          
          baseResult.metadata = {
            file_size: stats.size,
            row_count: rows.length,
            column_count: headers.length,
            headers: headers
          };

          if (options.conversionType === 'summary') {
            baseResult.content = {
              summary: `CSV file with ${rows.length} rows and ${headers.length} columns.`,
              headers: headers,
              sample_rows: rows.slice(0, 5)
            };
          } else if (options.conversionType === 'full_content') {
            baseResult.content = {
              headers: headers,
              data: rows
            };
          } else {
            baseResult.content = {
              structure: {
                headers: headers,
                data_types: this.inferDataTypes(rows.slice(0, 10))
              }
            };
          }

          resolve(baseResult);
        })
        .on('error', reject);
    });
  }

  private async processJSON(filePath: string, baseResult: ProcessedContent, options: ProcessingOptions): Promise<ProcessedContent> {
    const content = await fs.readFile(filePath, 'utf-8');
    const jsonData = JSON.parse(content);
    const stats = await fs.stat(filePath);
    
    baseResult.metadata = {
      file_size: stats.size,
      structure_type: Array.isArray(jsonData) ? 'array' : 'object',
      key_count: Array.isArray(jsonData) ? jsonData.length : Object.keys(jsonData).length
    };

    if (options.conversionType === 'summary') {
      baseResult.content = {
        summary: `JSON ${baseResult.metadata.structure_type} with ${baseResult.metadata.key_count} items/keys.`,
        top_level_keys: Array.isArray(jsonData) ? ['array_items'] : Object.keys(jsonData).slice(0, 10),
        sample_data: Array.isArray(jsonData) ? jsonData.slice(0, 3) : jsonData
      };
    } else if (options.conversionType === 'full_content') {
      baseResult.content = {
        data: jsonData
      };
    }

    return baseResult;
  }

  private async processXML(filePath: string, baseResult: ProcessedContent, options: ProcessingOptions): Promise<ProcessedContent> {
    const content = await fs.readFile(filePath, 'utf-8');
    const stats = await fs.stat(filePath);
    
    // Basic XML parsing simulation
    const tagMatches = content.match(/<[^/>][^>]*>/g) || [];
    const uniqueTags = Array.from(new Set(tagMatches.map(tag => tag.replace(/<\/?([^>\s]+).*?>/g, '$1'))));
    
    baseResult.metadata = {
      file_size: stats.size,
      tag_count: tagMatches.length,
      unique_tags: uniqueTags.length,
      root_elements: uniqueTags.slice(0, 5)
    };

    if (options.conversionType === 'summary') {
      baseResult.content = {
        summary: `XML document with ${uniqueTags.length} unique tag types.`,
        structure: uniqueTags,
        sample_content: content.substring(0, 500)
      };
    } else if (options.conversionType === 'full_content') {
      baseResult.content = {
        xml_content: content,
        parsed_structure: "Full XML parsing would be implemented here"
      };
    }

    return baseResult;
  }

  private async processImage(filePath: string, baseResult: ProcessedContent, options: ProcessingOptions): Promise<ProcessedContent> {
    const buffer = await fs.readFile(filePath);
    const stats = await fs.stat(filePath);
    
    try {
      // Extract basic metadata
      baseResult.metadata = {
        file_size: stats.size,
        created_date: stats.birthtime.toISOString().split('T')[0],
        mime_type: this.getMimeType(baseResult.document_type),
        format: baseResult.document_type.toUpperCase()
      };

      // Process content based on conversion type
      if (options.conversionType === 'summary') {
        baseResult.content = {
          summary: `${baseResult.document_type.toUpperCase()} image file (${this.formatFileSize(stats.size)})`,
          image_info: {
            format: baseResult.document_type.toUpperCase(),
            file_size: this.formatFileSize(stats.size),
            estimated_type: "Image file - content cannot be extracted as text"
          }
        };
      } else if (options.conversionType === 'full_content') {
        baseResult.content = {
          message: "Image files cannot be converted to text content",
          image_info: {
            format: baseResult.document_type.toUpperCase(),
            file_size: this.formatFileSize(stats.size),
            file_path: filePath,
            mime_type: this.getMimeType(baseResult.document_type)
          },
          available_operations: [
            "View image",
            "Download original file",
            "Get metadata information"
          ]
        };
      } else { // metadata_only
        baseResult.content = {
          structure: {
            document_type: "IMAGE",
            format: baseResult.document_type.toUpperCase(),
            is_binary: true,
            processing_note: "Binary image file - no text content available"
          }
        };
      }

      return baseResult;
    } catch (error) {
      throw new Error(`Failed to process image: ${error}`);
    }
  }

  private getMimeType(fileType: string): string {
    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'bmp': 'image/bmp',
      'webp': 'image/webp'
    };
    return mimeTypes[fileType.toLowerCase()] || 'image/unknown';
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private inferDataTypes(rows: any[]): Record<string, string> {
    if (rows.length === 0) return {};
    
    const types: Record<string, string> = {};
    const headers = Object.keys(rows[0]);
    
    headers.forEach(header => {
      const values = rows.map(row => row[header]).filter(val => val != null && val !== '');
      if (values.length === 0) {
        types[header] = 'unknown';
        return;
      }
      
      const firstValue = values[0];
      if (!isNaN(Number(firstValue))) {
        types[header] = firstValue.includes('.') ? 'float' : 'integer';
      } else if (firstValue.toLowerCase() === 'true' || firstValue.toLowerCase() === 'false') {
        types[header] = 'boolean';
      } else {
        types[header] = 'string';
      }
    });
    
    return types;
  }
}
