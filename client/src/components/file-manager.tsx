import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, Settings, Eye, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ProcessedFile, FILE_TYPES } from "@/types/file-processing";

interface FileManagerProps {
  files: ProcessedFile[];
  isLoading: boolean;
  onFileSelect: (file: ProcessedFile) => void;
  selectedFile?: ProcessedFile;
}

export default function FileManager({ files, isLoading, onFileSelect, selectedFile }: FileManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteFileMutation = useMutation({
    mutationFn: async (fileId: string) => {
      await apiRequest("DELETE", `/api/files/${fileId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      toast({
        title: "File deleted",
        description: "File has been deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete file",
        variant: "destructive",
      });
    },
  });

  const clearAllFilesMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/files");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      toast({
        title: "All files cleared",
        description: "All files have been deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Clear failed",
        description: error.message || "Failed to clear files",
        variant: "destructive",
      });
    },
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
          Processed
        </Badge>;
      case 'processing':
        return <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100">
          <span className="w-2 h-2 bg-amber-500 rounded-full mr-2 animate-pulse"></span>
          Processing
        </Badge>;
      case 'error':
        return <Badge variant="destructive">
          <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
          Error
        </Badge>;
      default:
        return <Badge variant="outline">
          <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
          Uploaded
        </Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-foreground">File Library</h2>
            <Skeleton className="h-8 w-24" />
          </div>
          
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                <Skeleton className="h-8 w-8" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-48 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-16" />
                <div className="flex space-x-2">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-foreground">File Library</h2>
          <div className="flex space-x-2">
            <Button variant="ghost" size="sm">
              <Filter className="h-4 w-4 mr-1" />
              Filter
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => clearAllFilesMutation.mutate()}
              disabled={clearAllFilesMutation.isPending || files.length === 0}
              className="text-destructive hover:text-destructive"
              data-testid="button-clear-all"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          </div>
        </div>
        
        {files.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
              <Eye className="h-6 w-6" />
            </div>
            <p>No files uploaded yet. Upload files to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium text-muted-foreground">File Name</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Type</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Size</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {files.map((file) => {
                  const fileType = FILE_TYPES[file.fileType];
                  const isSelected = selectedFile?.id === file.id;
                  
                  return (
                    <tr 
                      key={file.id} 
                      className={`hover:bg-muted/30 cursor-pointer transition-colors ${
                        isSelected ? 'bg-accent/50' : ''
                      }`}
                      onClick={() => onFileSelect(file)}
                      data-testid={`file-row-${file.id}`}
                    >
                      <td className="p-3">
                        <div className="flex items-center space-x-3">
                          <i className={`${fileType?.icon || 'fas fa-file'} ${fileType?.color || 'text-gray-500'}`}></i>
                          <span className="font-medium" title={file.originalName}>
                            {file.originalName}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {fileType?.extension || file.fileType.toUpperCase()}
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {formatFileSize(file.fileSize)}
                      </td>
                      <td className="p-3">
                        {getStatusBadge(file.status)}
                      </td>
                      <td className="p-3">
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onFileSelect(file);
                            }}
                            disabled={file.status === 'processing'}
                            data-testid={`button-configure-${file.id}`}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onFileSelect(file);
                            }}
                            data-testid={`button-view-${file.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteFileMutation.mutate(file.id);
                            }}
                            disabled={deleteFileMutation.isPending}
                            className="text-destructive hover:text-destructive"
                            data-testid={`button-delete-${file.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
