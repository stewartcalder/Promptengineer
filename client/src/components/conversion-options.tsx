import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ServerCog, Clock, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ProcessedFile, ConversionType, FILE_TYPES } from "@/types/file-processing";

interface ConversionOptionsProps {
  selectedFile?: ProcessedFile;
  onConversionComplete?: () => void;
}

export default function ConversionOptions({ selectedFile, onConversionComplete }: ConversionOptionsProps) {
  const [conversionType, setConversionType] = useState<ConversionType>('summary');
  const [includeTables, setIncludeTables] = useState(true);
  const [includeImages, setIncludeImages] = useState(false);
  const [preserveFormatting, setPreserveFormatting] = useState(true);
  const [estimatedTokens, setEstimatedTokens] = useState(0);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const convertFileMutation = useMutation({
    mutationFn: async (data: {
      fileId: string;
      conversionType: ConversionType;
      includeTables: boolean;
      includeImages: boolean;
      preserveFormatting: boolean;
    }) => {
      const response = await apiRequest("POST", `/api/files/${data.fileId}/convert`, data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      toast({
        title: "Conversion started",
        description: "File is being processed. Results will appear shortly.",
      });
      onConversionComplete?.();
    },
    onError: (error: any) => {
      toast({
        title: "Conversion failed",
        description: error.message || "Failed to start conversion",
        variant: "destructive",
      });
    },
  });

  // Update token estimation when options change
  useEffect(() => {
    if (!selectedFile) {
      setEstimatedTokens(0);
      return;
    }

    // Simple estimation based on file size and conversion type
    let baseTokens = Math.floor(selectedFile.fileSize / 4); // ~1 token per 4 bytes as rough estimate
    
    // Adjust based on conversion type
    switch (conversionType) {
      case 'summary':
        baseTokens = Math.floor(baseTokens * 0.3); // Summary is ~30% of full content
        break;
      case 'metadata_only':
        baseTokens = Math.floor(baseTokens * 0.1); // Metadata is ~10% of full content
        break;
      case 'full_content':
      default:
        // Keep base tokens
        break;
    }

    // Adjust based on options
    if (!includeTables) baseTokens = Math.floor(baseTokens * 0.8);
    if (!includeImages) baseTokens = Math.floor(baseTokens * 0.9);
    
    setEstimatedTokens(Math.max(50, baseTokens)); // Minimum 50 tokens
  }, [selectedFile, conversionType, includeTables, includeImages, preserveFormatting]);

  const handleConvert = () => {
    if (!selectedFile) return;

    convertFileMutation.mutate({
      fileId: selectedFile.id,
      conversionType,
      includeTables,
      includeImages,
      preserveFormatting,
    });
  };

  const calculateCost = (tokens: number) => {
    return (tokens / 1000) * 0.03; // $0.03 per 1K tokens estimate
  };

  const calculateContextPercentage = (tokens: number) => {
    return (tokens / 128000) * 100; // Assume 128K context window
  };

  if (!selectedFile) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Conversion Options</h3>
            <div className="text-center py-8 text-muted-foreground">
              <ServerCog className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select a file to configure conversion options</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Token Estimation</h3>
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No file selected</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fileType = FILE_TYPES[selectedFile.fileType];

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Conversion Options</h3>
          
          {/* File Selection */}
          <div className="mb-6">
            <Label className="text-sm font-medium text-foreground mb-2 block">Selected File</Label>
            <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-md">
              <i className={`${fileType?.icon || 'fas fa-file'} ${fileType?.color || 'text-gray-500'}`}></i>
              <span className="text-sm font-medium" title={selectedFile.originalName}>
                {selectedFile.originalName}
              </span>
            </div>
          </div>
          
          {/* Conversion Type */}
          <div className="mb-6">
            <Label className="text-sm font-medium text-foreground mb-3 block">Conversion Type</Label>
            <RadioGroup 
              value={conversionType} 
              onValueChange={(value: ConversionType) => setConversionType(value)}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="summary" id="summary" />
                <div className="flex-1">
                  <Label htmlFor="summary" className="text-sm font-medium cursor-pointer">Summary</Label>
                  <p className="text-xs text-muted-foreground">Key points and main content</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="full_content" id="full_content" />
                <div className="flex-1">
                  <Label htmlFor="full_content" className="text-sm font-medium cursor-pointer">Full Content</Label>
                  <p className="text-xs text-muted-foreground">Complete text extraction</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="metadata_only" id="metadata_only" />
                <div className="flex-1">
                  <Label htmlFor="metadata_only" className="text-sm font-medium cursor-pointer">Metadata Only</Label>
                  <p className="text-xs text-muted-foreground">File information and structure</p>
                </div>
              </div>
            </RadioGroup>
          </div>
          
          {/* Additional Options */}
          <div className="mb-6">
            <Label className="text-sm font-medium text-foreground mb-3 block">Additional Options</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="includeTables"
                  checked={includeTables}
                  onCheckedChange={(checked) => setIncludeTables(Boolean(checked))}
                />
                <Label htmlFor="includeTables" className="text-sm cursor-pointer">Include tables</Label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="includeImages"
                  checked={includeImages}
                  onCheckedChange={(checked) => setIncludeImages(Boolean(checked))}
                />
                <Label htmlFor="includeImages" className="text-sm cursor-pointer">Include images metadata</Label>
              </div>
              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="preserveFormatting"
                  checked={preserveFormatting}
                  onCheckedChange={(checked) => setPreserveFormatting(Boolean(checked))}
                />
                <Label htmlFor="preserveFormatting" className="text-sm cursor-pointer">Preserve formatting</Label>
              </div>
            </div>
          </div>
          
          {/* Process Button */}
          <Button 
            className="w-full" 
            onClick={handleConvert}
            disabled={convertFileMutation.isPending || selectedFile.status === 'processing'}
            data-testid="button-generate-json"
          >
            <ServerCog className="h-4 w-4 mr-2" />
            {convertFileMutation.isPending || selectedFile.status === 'processing' 
              ? "Processing..." 
              : "Generate JSON"
            }
          </Button>
        </CardContent>
      </Card>
      
      {/* Token Estimation */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Token Estimation</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Estimated tokens:</span>
              <span className="text-lg font-semibold text-foreground" data-testid="estimated-tokens">
                {estimatedTokens.toLocaleString()}
              </span>
            </div>
            
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300" 
                style={{ width: `${Math.min(calculateContextPercentage(estimatedTokens), 100)}%` }}
              ></div>
            </div>
            
            <div className="text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>~{calculateContextPercentage(estimatedTokens).toFixed(1)}% of typical context window</span>
                <span>Cost estimate: ${calculateCost(estimatedTokens).toFixed(4)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
