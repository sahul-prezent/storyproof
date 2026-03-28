import type { AIProvider, CompletionParams, CompletionResult } from './providers/base';
import { OpenAIProvider } from './providers/openai';
import type { ModelTier } from '@/types/scoring';

/**
 * Model router that maps signal complexity tiers to AI providers.
 * Designed for cost optimization: simple signals use cheaper models.
 */

const providers: Record<ModelTier, AIProvider> = {
  fast: new OpenAIProvider('gpt-4o-mini'),
  standard: new OpenAIProvider('gpt-4o-mini'),
  advanced: new OpenAIProvider('gpt-4o'),
};

export function getProvider(tier: ModelTier): AIProvider {
  return providers[tier];
}

export async function complete(
  tier: ModelTier,
  params: CompletionParams
): Promise<CompletionResult> {
  const provider = getProvider(tier);
  return provider.complete(params);
}

/**
 * Determine the model tier for a category based on its most complex signal.
 * Categories with any advanced signals use the advanced model.
 */
export function getCategoryTier(signalTiers: ModelTier[]): ModelTier {
  if (signalTiers.includes('advanced')) return 'advanced';
  if (signalTiers.includes('standard')) return 'standard';
  return 'fast';
}
