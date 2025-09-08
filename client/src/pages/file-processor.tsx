import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import FileUploader from "@/components/file-uploader";
import FileManager from "@/components/file-manager";
import ConversionOptions from "@/components/conversion-options";
import JsonOutput from "@/components/json-output";
import { ProcessedFile } from "@/types/file-processing";

export default function FileProcessor() {
  const [selectedFile, setSelectedFile] = useState<ProcessedFile>();

  const { data: files = [], isLoading, refetch } = useQuery<ProcessedFile[]>({
    queryKey: ["/api/files"],
  });

  const handleUploadComplete = () => {
    refetch();
  };

  const handleConversionComplete = () => {
    refetch();
  };

  const handleFileSelect = (file: ProcessedFile) => {
    setSelectedFile(file);
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* File Upload & Management Section */}
          <div className="lg:col-span-2 space-y-6">
            <FileUploader onUploadComplete={handleUploadComplete} />
            
            <FileManager
              files={files}
              isLoading={isLoading}
              onFileSelect={handleFileSelect}
              selectedFile={selectedFile}
            />
          </div>

          {/* Conversion Options & Token Estimation */}
          <div className="space-y-6">
            <ConversionOptions 
              selectedFile={selectedFile}
              onConversionComplete={handleConversionComplete}
            />
          </div>
        </div>
        
        {/* JSON Output Section */}
        <div className="mt-8">
          <JsonOutput selectedFile={selectedFile} />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <div className="flex items-center space-x-4">
              <span>File Processing Engine v2.1</span>
              <span>•</span>
              <span>{files.length} files in session</span>
              <span>•</span>
              <span>
                {files.reduce((total, file) => total + (file.latestConversion?.tokenCount || 0), 0).toLocaleString()} tokens generated
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <button className="hover:text-foreground transition-colors">
                <i className="fas fa-question-circle mr-1"></i>Help
              </button>
              <button className="hover:text-foreground transition-colors">
                <i className="fas fa-cog mr-1"></i>Settings
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
