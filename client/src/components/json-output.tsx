import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Copy, Code, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProcessedFile } from "@/types/file-processing";

interface JsonOutputProps {
  selectedFile?: ProcessedFile;
}

export default function JsonOutput({ selectedFile }: JsonOutputProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const latestConversion = selectedFile?.latestConversion;

  const copyToClipboard = async () => {
    if (!latestConversion?.jsonOutput) return;
    
    try {
      await navigator.clipboard.writeText(JSON.stringify(latestConversion.jsonOutput, null, 2));
      setCopied(true);
      toast({
        title: "JSON copied",
        description: "JSON output copied to clipboard successfully!",
      });
      
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Failed to copy JSON to clipboard",
        variant: "destructive",
      });
    }
  };

  const downloadJson = () => {
    if (!latestConversion?.jsonOutput || !selectedFile) return;
    
    const blob = new Blob([JSON.stringify(latestConversion.jsonOutput, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedFile.originalName.replace(/\.[^/.]+$/, '')}_converted.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download started",
      description: "JSON file download has started",
    });
  };

  const syntaxHighlight = (json: string) => {
    return json.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        let cls = 'text-foreground';
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'text-blue-400'; // keys
          } else {
            cls = 'text-green-400'; // strings
          }
        } else if (/true|false/.test(match)) {
          cls = 'text-purple-400'; // booleans
        } else if (/null/.test(match)) {
          cls = 'text-gray-400'; // null
        } else {
          cls = 'text-yellow-400'; // numbers
        }
        return `<span class="${cls}">${match}</span>`;
      }
    );
  };

  if (!selectedFile) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-foreground">Generated JSON Output</h3>
          </div>
          
          <div className="text-center py-8 text-muted-foreground">
            <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Select a file to view JSON output</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!latestConversion) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-foreground">Generated JSON Output</h3>
          </div>
          
          <div className="text-center py-8 text-muted-foreground">
            <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No conversions yet. Generate JSON to see output here.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (latestConversion.status === 'processing') {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-foreground">Generated JSON Output</h3>
            <Badge variant="secondary" className="bg-amber-100 text-amber-800">
              <span className="w-2 h-2 bg-amber-500 rounded-full mr-2 animate-pulse"></span>
              Processing
            </Badge>
          </div>
          
          <div className="text-center py-8 text-muted-foreground">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p>Processing file... Results will appear here shortly.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (latestConversion.status === 'error') {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-foreground">Generated JSON Output</h3>
            <Badge variant="destructive">Error</Badge>
          </div>
          
          <div className="text-center py-8 text-muted-foreground">
            <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Conversion failed</p>
            {latestConversion.error && (
              <p className="text-sm text-destructive mt-2">{latestConversion.error}</p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!latestConversion.jsonOutput) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-foreground">Generated JSON Output</h3>
          </div>
          
          <div className="text-center py-8 text-muted-foreground">
            <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No output available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const jsonString = JSON.stringify(latestConversion.jsonOutput, null, 2);
  const highlightedJson = syntaxHighlight(jsonString);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-foreground">Generated JSON Output</h3>
            {latestConversion.tokenCount && (
              <Badge variant="outline">
                {latestConversion.tokenCount.toLocaleString()} tokens
              </Badge>
            )}
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={downloadJson}
              data-testid="button-download-json"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              onClick={copyToClipboard}
              data-testid="button-copy-json"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy to Clipboard
                </>
              )}
            </Button>
          </div>
        </div>
        
        <div className="bg-gray-900 rounded-lg border overflow-hidden">
          <pre className="p-4 text-sm overflow-x-auto font-mono max-h-96 overflow-y-auto">
            <code 
              dangerouslySetInnerHTML={{ __html: highlightedJson }}
              data-testid="json-output-content"
            />
          </pre>
        </div>
        
        {copied && (
          <div className="mt-3 p-3 bg-green-100 border border-green-200 rounded-md">
            <div className="flex items-center">
              <Check className="h-4 w-4 text-green-500 mr-2" />
              <span className="text-green-700 text-sm font-medium">JSON copied to clipboard successfully!</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
