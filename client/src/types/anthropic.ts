export interface AnthropicMessage {
  role: "user" | "assistant";
  content: string | ContentBlock[];
}

export interface ContentBlock {
  type: "text" | "image";
  text?: string;
  source?: {
    type: string;
    media_type: string;
    data: string;
  };
}

export interface AnthropicParameters {
  model: string;
  max_tokens: number;
  temperature: number;
  top_k?: number;
  stop_sequences?: string[];
  tool_choice?: "auto" | "any" | "none";
  thinking?: {
    type: "enabled";
    budget_tokens: number;
  };
}

export interface AnthropicResponse {
  id: string;
  type: "message";
  role: "assistant";
  content: Array<{
    type: "text";
    text: string;
  }>;
  model: string;
  stop_reason: "end_turn" | "stop_sequence" | "max_tokens";
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  };
}

export interface ExecutionResult {
  executionId: string;
  response: AnthropicResponse;
  usage: AnthropicResponse["usage"];
  cost: number;
}
