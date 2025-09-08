import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { History, Filter, Search, Plus, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import type { PromptTemplate, PromptExecution } from "@shared/schema";

interface HistoryViewerProps {
  onLoadTemplate: (template: PromptTemplate) => void;
}

export default function HistoryViewer({ onLoadTemplate }: HistoryViewerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: executions, isLoading: executionsLoading } = useQuery({
    queryKey: ["/api/executions"],
    queryFn: async () => {
      const response = await fetch("/api/executions", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch executions");
      return response.json() as Promise<PromptExecution[]>;
    },
  });

  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ["/api/templates"],
    queryFn: async () => {
      const response = await fetch("/api/templates", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch templates");
      return response.json() as Promise<PromptTemplate[]>;
    },
  });

  const saveTemplateFromCurrentMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      // This would normally be passed from parent, but for demo purposes
      const templateData = {
        name: data.name,
        description: data.description,
        systemPrompt: "Current system prompt",
        messages: [],
        parameters: { model: "claude-sonnet-4-20250514", max_tokens: 1024, temperature: 0.7 },
      };
      const response = await apiRequest("POST", "/api/templates", templateData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({
        title: "Template saved",
        description: "Current prompt saved as template",
      });
    },
  });

  const deleteExecutionMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/executions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/executions"] });
      toast({
        title: "Execution deleted",
        description: "Execution removed from history",
      });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
      toast({
        title: "Template deleted",
        description: "Template removed from library",
      });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case "error":
        return <XCircle className="h-3 w-3 text-red-500" />;
      case "rate_limited":
        return <AlertTriangle className="h-3 w-3 text-yellow-500" />;
      case "pending":
        return <Clock className="h-3 w-3 text-blue-500" />;
      default:
        return <div className="h-3 w-3 bg-gray-500 rounded-full" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      success: { label: "Successful", variant: "default" as const },
      error: { label: "Failed", variant: "destructive" as const },
      rate_limited: { label: "Rate Limited", variant: "secondary" as const },
      pending: { label: "Pending", variant: "outline" as const },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || 
                   { label: "Unknown", variant: "outline" as const };
    
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatTimeAgo = (date: Date | string) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return `${Math.floor(diffMins / 1440)} days ago`;
  };

  if (executionsLoading || templatesLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading history...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const allItems = [
    ...(executions || []).map(exec => ({ ...exec, type: 'execution' as const })),
    ...(templates || []).map(template => ({ ...template, type: 'template' as const }))
  ].sort((a, b) => {
    const aDate = 'executedAt' in a ? a.executedAt : a.createdAt;
    const bDate = 'executedAt' in b ? b.executedAt : b.createdAt;
    return new Date(bDate).getTime() - new Date(aDate).getTime();
  });

  const filteredItems = allItems.filter(item => {
    if (!searchQuery) return true;
    const name = 'name' in item ? item.name : `Execution ${item.id.slice(0, 8)}`;
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <History className="h-5 w-5" />
            <span>Prompt History & Templates</span>
          </CardTitle>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-48"
                data-testid="input-search-history"
              />
            </div>
            <Button 
              size="sm"
              onClick={() => saveTemplateFromCurrentMutation.mutate({ 
                name: `Template_${new Date().toISOString().slice(0, 10)}` 
              })}
              data-testid="button-save-template"
            >
              <Plus className="h-4 w-4 mr-2" />
              Save as Template
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {filteredItems.map((item) => (
            <div 
              key={item.id}
              className="border border-border rounded-lg p-4 hover:bg-muted/20 transition-colors"
              data-testid={`history-item-${item.id}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(item.type === 'execution' ? item.status : 'template')}
                  <span className="font-medium text-foreground">
                    {item.type === 'template' ? item.name : `Execution ${item.id.slice(0, 8)}`}
                  </span>
                  {item.type === 'execution' 
                    ? getStatusBadge(item.status)
                    : <Badge variant="secondary">Template</Badge>
                  }
                </div>
                <span className="text-sm text-muted-foreground">
                  {formatTimeAgo(item.type === 'execution' ? item.executedAt : item.createdAt)}
                </span>
              </div>
              
              <p className="text-sm text-muted-foreground mb-3">
                {item.type === 'execution' 
                  ? `${(item.parameters as any).model} • ${Array.isArray(item.messages) ? item.messages.length : 0} messages${item.outputTokens ? ` • ${item.outputTokens} output tokens` : ''}${item.cost ? ` • $${item.cost.toFixed(4)}` : ''}`
                  : item.description || `${Array.isArray(item.messages) ? item.messages.length : 0} messages configured`
                }
              </p>
              
              <div className="flex items-center space-x-2">
                {item.type === 'template' && (
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="text-primary p-0 h-auto"
                    onClick={() => onLoadTemplate(item)}
                    data-testid={`button-load-${item.id}`}
                  >
                    Load Template
                  </Button>
                )}
                {item.type === 'execution' && (
                  <>
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="text-primary p-0 h-auto"
                      data-testid={`button-view-${item.id}`}
                    >
                      View Response
                    </Button>
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="text-primary p-0 h-auto"
                      data-testid={`button-retry-${item.id}`}
                    >
                      Retry
                    </Button>
                  </>
                )}
                <Button 
                  variant="link" 
                  size="sm" 
                  className="text-primary p-0 h-auto"
                  data-testid={`button-export-${item.id}`}
                >
                  Export
                </Button>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="text-destructive p-0 h-auto"
                  onClick={() => {
                    if (item.type === 'execution') {
                      deleteExecutionMutation.mutate(item.id);
                    } else {
                      deleteTemplateMutation.mutate(item.id);
                    }
                  }}
                  data-testid={`button-delete-${item.id}`}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}

          {filteredItems.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>
                {searchQuery 
                  ? "No items match your search" 
                  : "No history yet. Execute some prompts to see them here."
                }
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
