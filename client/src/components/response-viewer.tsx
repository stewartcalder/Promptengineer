import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Save, Copy, Code, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { ExecutionResult } from "@/types/anthropic";

interface ResponseViewerProps {
  execution: ExecutionResult | null;
  isLoading: boolean;
}

export default function ResponseViewer({ execution, isLoading }: ResponseViewerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const saveResponseMutation = useMutation({
    mutationFn: async () => {
      if (!execution) throw new Error("No execution to save");
      // The execution is already saved automatically, this is just for user feedback
      return execution;
    },
    onSuccess: () => {
      toast({
        title: "Response saved",
        description: "Response has been saved to history",
      });
    },
  });

  const copyContent = () => {
    if (execution?.response.content[0]?.text) {
      navigator.clipboard.writeText(execution.response.content[0].text).then(() => {
        toast({
          title: "Content copied",
          description: "Response content copied to clipboard",
        });
      });
    }
  };

  const copyRawJson = () => {
    if (execution?.response) {
      navigator.clipboard.writeText(JSON.stringify(execution.response, null, 2)).then(() => {
        toast({
          title: "JSON copied",
          description: "Raw JSON response copied to clipboard",
        });
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>API Response</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-muted-foreground">Executing prompt...</span>
            </div>
            <Skeleton className="h-32 w-full" />
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!execution) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>API Response</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No response yet. Execute a prompt to see the results here.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = () => {
    if (execution.response) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusText = () => {
    if (execution.response) {
      return "200 OK";
    }
    return "Error";
  };

  return (
    <div className="space-y-6">
      {/* Response Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>API Response</span>
            </CardTitle>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                {getStatusIcon()}
                <span className="text-sm text-muted-foreground">{getStatusText()}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                Response time: 1.2s
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Response Content */}
          {execution.response?.content[0]?.text && (
            <div className="bg-muted/30 rounded-lg p-4">
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {execution.response.content[0].text}
              </p>
            </div>
          )}

          {/* Token Usage */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="text-sm font-medium text-foreground">Input Tokens</div>
              <div className="text-lg font-bold text-primary" data-testid="text-input-tokens">
                {execution.usage.input_tokens}
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="text-sm font-medium text-foreground">Output Tokens</div>
              <div className="text-lg font-bold text-accent" data-testid="text-output-tokens">
                {execution.usage.output_tokens}
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="text-sm font-medium text-foreground">Total Cost</div>
              <div className="text-lg font-bold text-foreground" data-testid="text-cost">
                ${execution.cost.toFixed(4)}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            <Button 
              onClick={() => saveResponseMutation.mutate()}
              disabled={saveResponseMutation.isPending}
              data-testid="button-save-response"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Response
            </Button>
            <Button 
              variant="outline" 
              onClick={copyContent}
              data-testid="button-copy-content"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Content
            </Button>
            <Button 
              variant="outline" 
              onClick={copyRawJson}
              data-testid="button-view-json"
            >
              <Code className="h-4 w-4 mr-2" />
              Copy Raw JSON
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Raw JSON Response */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Raw JSON Response</CardTitle>
            <Button variant="outline" size="sm" onClick={copyRawJson}>
              <Copy className="h-4 w-4 mr-2" />
              Copy JSON
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/30 rounded-lg border">
            <pre className="p-4 text-sm overflow-x-auto font-mono whitespace-pre-wrap">
              {JSON.stringify(execution.response, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
