import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Upload, Download, Bot } from "lucide-react";
import ApiConfiguration from "@/components/api-configuration";
import MessageBuilder from "@/components/message-builder";
import JsonEditor from "@/components/json-editor";
import ResponseViewer from "@/components/response-viewer";
import HistoryViewer from "@/components/history-viewer";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { AnthropicMessage, AnthropicParameters, ExecutionResult } from "@/types/anthropic";

export default function PromptBuilder() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("builder");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [messages, setMessages] = useState<AnthropicMessage[]>([
    { role: "user", content: "" }
  ]);
  const [parameters, setParameters] = useState<AnthropicParameters>({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    temperature: 0.7,
  });
  const [currentExecution, setCurrentExecution] = useState<ExecutionResult | null>(null);

  const executePromptMutation = useMutation({
    mutationFn: async (data: {
      systemPrompt?: string;
      messages: AnthropicMessage[];
      parameters: AnthropicParameters;
    }) => {
      const response = await apiRequest("POST", "/api/execute", data);
      return response.json() as Promise<ExecutionResult>;
    },
    onSuccess: (result) => {
      setCurrentExecution(result);
      setActiveTab("response");
      queryClient.invalidateQueries({ queryKey: ["/api/executions"] });
      toast({
        title: "Prompt executed successfully",
        description: `Generated ${result.usage.output_tokens} tokens for $${result.cost.toFixed(4)}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Execution failed",
        description: error.message || "Failed to execute prompt",
        variant: "destructive",
      });
    },
  });

  const handleExecute = () => {
    const validMessages = messages.filter(msg => 
      typeof msg.content === 'string' ? msg.content.trim() : msg.content.length > 0
    );
    
    if (validMessages.length === 0) {
      toast({
        title: "No messages to execute",
        description: "Please add at least one message with content",
        variant: "destructive",
      });
      return;
    }

    executePromptMutation.mutate({
      systemPrompt: systemPrompt.trim() || undefined,
      messages: validMessages,
      parameters,
    });
  };

  const exportTemplate = () => {
    const template = {
      name: `Template_${new Date().toISOString().slice(0, 10)}`,
      systemPrompt,
      messages,
      parameters,
    };
    
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importTemplate = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const template = JSON.parse(e.target?.result as string);
            setSystemPrompt(template.systemPrompt || "");
            setMessages(template.messages || [{ role: "user", content: "" }]);
            setParameters({ ...parameters, ...template.parameters });
            toast({
              title: "Template imported",
              description: "Template loaded successfully",
            });
          } catch (error) {
            toast({
              title: "Import failed",
              description: "Invalid template file",
              variant: "destructive",
            });
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-semibold text-foreground">Anthropic API Prompt Builder</h1>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={importTemplate} data-testid="button-import">
                <Upload className="h-4 w-4 mr-2" />
                Import Template
              </Button>
              <Button variant="outline" onClick={exportTemplate} data-testid="button-export">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button 
                onClick={handleExecute} 
                disabled={executePromptMutation.isPending}
                data-testid="button-execute"
              >
                <Play className="h-4 w-4 mr-2" />
                {executePromptMutation.isPending ? "Executing..." : "Execute Prompt"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* API Configuration Sidebar */}
          <div className="lg:col-span-1">
            <ApiConfiguration 
              parameters={parameters}
              onChange={setParameters}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="builder" data-testid="tab-builder">Message Builder</TabsTrigger>
                <TabsTrigger value="json-input" data-testid="tab-json">JSON Editor</TabsTrigger>
                <TabsTrigger value="response" data-testid="tab-response">
                  Response
                  {currentExecution && (
                    <Badge variant="secondary" className="ml-2">
                      New
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="history" data-testid="tab-history">History</TabsTrigger>
              </TabsList>

              <TabsContent value="builder" className="mt-6">
                <MessageBuilder
                  systemPrompt={systemPrompt}
                  onSystemPromptChange={setSystemPrompt}
                  messages={messages}
                  onMessagesChange={setMessages}
                />
              </TabsContent>

              <TabsContent value="json-input" className="mt-6">
                <JsonEditor
                  systemPrompt={systemPrompt}
                  messages={messages}
                  parameters={parameters}
                  onUpdate={(data) => {
                    setSystemPrompt(data.systemPrompt || "");
                    setMessages(data.messages);
                    setParameters({ ...parameters, ...data.parameters });
                  }}
                />
              </TabsContent>

              <TabsContent value="response" className="mt-6">
                <ResponseViewer 
                  execution={currentExecution}
                  isLoading={executePromptMutation.isPending}
                />
              </TabsContent>

              <TabsContent value="history" className="mt-6">
                <HistoryViewer 
                  onLoadTemplate={(template) => {
                    setSystemPrompt(template.systemPrompt || "");
                    setMessages(template.messages as AnthropicMessage[]);
                    setParameters({ ...parameters, ...template.parameters });
                    setActiveTab("builder");
                  }}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
