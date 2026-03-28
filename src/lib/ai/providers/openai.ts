import OpenAI from 'openai';
import type { AIProvider, CompletionParams, CompletionResult } from './base';

export class OpenAIProvider implements AIProvider {
  id: string;
  private client: OpenAI | null = null;
  private modelId: string;

  constructor(modelId: string) {
    this.id = `openai:${modelId}`;
    this.modelId = modelId;
  }

  private getClient(): OpenAI {
    if (!this.client) {
      this.client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
    return this.client;
  }

  async complete(params: CompletionParams): Promise<CompletionResult> {
    const start = Date.now();
    const client = this.getClient();

    const response = await client.chat.completions.create({
      model: this.modelId,
      messages: [
        { role: 'system', content: params.systemPrompt },
        { role: 'user', content: params.userPrompt },
      ],
      temperature: params.temperature ?? 0.3,
      max_tokens: params.maxTokens ?? 4096,
      ...(params.responseFormat === 'json' && {
        response_format: { type: 'json_object' },
      }),
    });

    const latencyMs = Date.now() - start;
    const choice = response.choices[0];

    return {
      content: choice.message.content || '',
      usage: {
        inputTokens: response.usage?.prompt_tokens || 0,
        outputTokens: response.usage?.completion_tokens || 0,
      },
      model: this.modelId,
      latencyMs,
    };
  }
}
