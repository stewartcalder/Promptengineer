import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Code, Check, Wand2, Copy } from "lucide-react";
import { useState, useEffect } from "react";
import type { AnthropicMessage, AnthropicParameters } from "@/types/anthropic";

interface JsonEditorProps {
  systemPrompt: string;
  messages: AnthropicMessage[];
  parameters: AnthropicParameters;
  onUpdate: (data: {
    systemPrompt?: string;
    messages: AnthropicMessage[];
    parameters: AnthropicParameters;
  }) => void;
}

export default function JsonEditor({
  systemPrompt,
  messages,
  parameters,
  onUpdate
}: JsonEditorProps) {
  const { toast } = useToast();
  const [jsonText, setJsonText] = useState("");
  const [isValid, setIsValid] = useState(true);

  // Sync JSON text with props
  useEffect(() => {
    const jsonData = {
      model: parameters.model,
      max_tokens: parameters.max_tokens,
      temperature: parameters.temperature,
      ...(parameters.top_k && { top_k: parameters.top_k }),
      ...(parameters.stop_sequences && { stop_sequences: parameters.stop_sequences }),
      ...(parameters.tool_choice && { tool_choice: parameters.tool_choice }),
      ...(parameters.thinking && { thinking: parameters.thinking }),
      ...(systemPrompt && { system: systemPrompt }),
      messages: messages,
    };
    setJsonText(JSON.stringify(jsonData, null, 2));
  }, [systemPrompt, messages, parameters]);

  const validateAndUpdate = () => {
    try {
      const parsed = JSON.parse(jsonText);
      
      // Extract system prompt
      const { system, messages: parsedMessages, ...parsedParameters } = parsed;
      
      // Validate required fields
      if (!parsedMessages || !Array.isArray(parsedMessages)) {
        throw new Error("Messages must be an array");
      }
      
      if (parsedMessages.some((msg: any) => !msg.role || !msg.content)) {
        throw new Error("All messages must have role and content");
      }

      onUpdate({
        systemPrompt: system || "",
        messages: parsedMessages,
        parameters: parsedParameters,
      });
      
      setIsValid(true);
      toast({
        title: "JSON validated",
        description: "Configuration updated successfully",
      });
    } catch (error: any) {
      setIsValid(false);
      toast({
        title: "Invalid JSON",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const formatJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setJsonText(JSON.stringify(parsed, null, 2));
      setIsValid(true);
    } catch (error) {
      setIsValid(false);
      toast({
        title: "Invalid JSON",
        description: "Cannot format invalid JSON",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(jsonText).then(() => {
      toast({
        title: "Copied",
        description: "JSON copied to clipboard",
      });
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Code className="h-5 w-5" />
            <span>JSON Request Editor</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={validateAndUpdate}
              data-testid="button-validate"
            >
              <Check className="h-4 w-4 mr-2" />
              Validate
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={formatJson}
              data-testid="button-format"
            >
              <Wand2 className="h-4 w-4 mr-2" />
              Format
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={copyToClipboard}
              data-testid="button-copy-json"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className={`border rounded-md ${isValid ? 'border-border' : 'border-destructive'}`}>
          <Textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            className="font-mono text-sm min-h-[400px] resize-none border-0 focus-visible:ring-0"
            placeholder="JSON will appear here..."
            data-testid="textarea-json-editor"
          />
        </div>
        {!isValid && (
          <p className="text-sm text-destructive mt-2">
            Please fix JSON syntax errors before proceeding
          </p>
        )}
      </CardContent>
    </Card>
  );
}
