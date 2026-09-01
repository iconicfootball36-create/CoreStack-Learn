/**
 * Teaching Service Layer
 * Coordinates active learning turns and strategy switching
 */

import { AIProvider, TeachingTurnInput, TeachingTurnOutput } from './provider';
import { GeminiAIProvider } from './gemini';
import { TeachingStrategy } from '@/src/types/database';

let aiProviderInstance: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (!aiProviderInstance) {
    aiProviderInstance = new GeminiAIProvider();
  }
  return aiProviderInstance;
}

export async function conductTeachingTurn(input: TeachingTurnInput): Promise<TeachingTurnOutput> {
  const provider = getAIProvider();
  return provider.teachConcept(input);
}

export async function conductAdaptiveReTeachingTurn(
  input: TeachingTurnInput & { misconception: string; newStrategy: TeachingStrategy }
): Promise<TeachingTurnOutput> {
  const provider = getAIProvider();
  return provider.generateAdaptiveExplanation(input);
}
