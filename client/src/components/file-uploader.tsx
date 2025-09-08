import { useState, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CloudUpload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FILE_TYPES } from "@/types/file-processing";

interface FileUploaderProps {
  onUploadComplete: () => void;
}

export default function FileUploader({ onUploadComplete }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  }, [isDragging]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only set dragging to false if we're leaving the drop zone entirely
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
    
    // Reset the input so the same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleFiles = async (files: File[]) => {
    if (files.length === 0) return;

    // Validate file types
    const validFiles = files.filter(file => {
      const extension = file.name.split('.').pop()?.toLowerCase();
      return extension && FILE_TYPES[extension];
    });

    if (validFiles.length !== files.length) {
      toast({
        title: "Invalid file types",
        description: "Some files were skipped. Only PDF, DOCX, TXT, MD, CSV, JSON, and XML files are supported.",
        variant: "destructive"
      });
    }

    if (validFiles.length === 0) return;

    // Validate file sizes (10MB limit)
    const oversizedFiles = validFiles.filter(file => file.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast({
        title: "Files too large",
        description: `${oversizedFiles.length} file(s) exceed the 10MB limit and were skipped.`,
        variant: "destructive"
      });
    }

    const validSizedFiles = validFiles.filter(file => file.size <= 10 * 1024 * 1024);
    if (validSizedFiles.length === 0) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      validSizedFiles.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      toast({
        title: "Upload successful",
        description: `${validSizedFiles.length} file(s) uploaded successfully.`,
      });

      onUploadComplete();
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload files",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const acceptedTypes = Object.values(FILE_TYPES).map(type => type.accept).join(',');

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Upload Files</h2>
        
        <div
          className={`rounded-lg p-8 text-center border-2 border-dashed transition-all ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-primary/5"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          data-testid="file-drop-zone"
        >
          <div className="mb-4">
            <CloudUpload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-foreground font-medium">
              {isDragging ? "Drop files here" : "Drop files here or click to browse"}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Supports PDF, DOCX, TXT, MD, CSV, JSON, XML (Max 10MB per file)
            </p>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            accept={acceptedTypes}
            onChange={handleFileSelect}
            data-testid="file-input"
          />
          
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            data-testid="button-choose-files"
          >
            {isUploading ? "Uploading..." : "Choose Files"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
