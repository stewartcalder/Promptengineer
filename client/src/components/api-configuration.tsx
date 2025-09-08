import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, CheckCircle } from "lucide-react";
import { useState } from "react";
import type { AnthropicParameters } from "@/types/anthropic";

interface ApiConfigurationProps {
  parameters: AnthropicParameters;
  onChange: (parameters: AnthropicParameters) => void;
}

export default function ApiConfiguration({ parameters, onChange }: ApiConfigurationProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [thinkingEnabled, setThinkingEnabled] = useState(!!parameters.thinking);

  const updateParameter = <K extends keyof AnthropicParameters>(
    key: K,
    value: AnthropicParameters[K]
  ) => {
    onChange({ ...parameters, [key]: value });
  };

  const handleThinkingToggle = (enabled: boolean) => {
    setThinkingEnabled(enabled);
    if (enabled) {
      updateParameter('thinking', { type: 'enabled', budget_tokens: 1024 });
    } else {
      const { thinking, ...rest } = parameters;
      onChange(rest);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>API Configuration</CardTitle>
        
        {/* API Key Status */}
        <div className="p-3 bg-muted rounded-md">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">API Key</span>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Connected</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Stored in Replit Secrets</p>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Model Selection */}
        <div className="space-y-2">
          <Label>Model</Label>
          <Select
            value={parameters.model}
            onValueChange={(value) => updateParameter('model', value)}
            data-testid="select-model"
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="claude-opus-4-1-20250805">Claude Opus 4.1</SelectItem>
              <SelectItem value="claude-sonnet-4-20250514">Claude Sonnet 4</SelectItem>
              <SelectItem value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</SelectItem>
              <SelectItem value="claude-3-haiku-20240307">Claude 3 Haiku</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Max Tokens */}
        <div className="space-y-2">
          <Label>Max Tokens</Label>
          <Input
            type="number"
            value={parameters.max_tokens}
            onChange={(e) => updateParameter('max_tokens', parseInt(e.target.value))}
            min={1}
            max={8192}
            data-testid="input-max-tokens"
          />
        </div>

        {/* Temperature */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>Temperature</Label>
            <span className="text-sm text-muted-foreground">{parameters.temperature}</span>
          </div>
          <Slider
            value={[parameters.temperature]}
            onValueChange={([value]) => updateParameter('temperature', value)}
            min={0}
            max={1}
            step={0.1}
            data-testid="slider-temperature"
          />
        </div>

        {/* Advanced Settings */}
        <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-medium hover:text-primary">
            Advanced Settings
            <ChevronDown className={`h-4 w-4 transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 mt-4">
            {/* Top K */}
            <div className="space-y-2">
              <Label>Top K</Label>
              <Input
                type="number"
                value={parameters.top_k || 40}
                onChange={(e) => updateParameter('top_k', parseInt(e.target.value))}
                min={1}
                max={100}
                data-testid="input-top-k"
              />
            </div>

            {/* Stop Sequences */}
            <div className="space-y-2">
              <Label>Stop Sequences</Label>
              <Textarea
                placeholder="Enter stop sequences (one per line)"
                value={parameters.stop_sequences?.join('\n') || ''}
                onChange={(e) => updateParameter('stop_sequences', 
                  e.target.value.split('\n').filter(s => s.trim())
                )}
                rows={3}
                data-testid="textarea-stop-sequences"
              />
            </div>

            {/* Tool Choice */}
            <div className="space-y-2">
              <Label>Tool Choice</Label>
              <Select
                value={parameters.tool_choice || "auto"}
                onValueChange={(value: "auto" | "any" | "none") => updateParameter('tool_choice', value)}
                data-testid="select-tool-choice"
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Extended Thinking */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Extended Thinking</Label>
            <Switch
              checked={thinkingEnabled}
              onCheckedChange={handleThinkingToggle}
              data-testid="switch-thinking"
            />
          </div>
          {thinkingEnabled && (
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Budget Tokens</Label>
              <Input
                type="number"
                value={parameters.thinking?.budget_tokens || 1024}
                onChange={(e) => updateParameter('thinking', {
                  type: 'enabled',
                  budget_tokens: parseInt(e.target.value)
                })}
                min={1024}
                data-testid="input-thinking-budget"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
