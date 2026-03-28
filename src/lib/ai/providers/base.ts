export interface CompletionParams {
  systemPrompt: string;
  userPrompt: string;
  responseFormat?: 'json';
  temperature?: number;
  maxTokens?: number;
}

export interface CompletionResult {
  content: string;
  usage: { inputTokens: number; outputTokens: number };
  model: string;
  latencyMs: number;
}

export interface AIProvider {
  id: string;
  complete(params: CompletionParams): Promise<CompletionResult>;
}
