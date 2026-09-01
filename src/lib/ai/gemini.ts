/**
 * Google Gemini Provider Implementation
 * Centralized server-side LLM provider for CoreStack Learn
 */

import { GoogleGenAI } from '@google/genai';
import {
  AIProvider,
  EvaluationInput,
  EvaluationOutput,
  MaterialAnalysisResult,
  QuizGenerationInput,
  TeachingTurnInput,
  TeachingTurnOutput,
} from './provider';
import { Quiz, TeachingStrategy, UnderstandingLevel } from '@/src/types/database';
import { buildMaterialAnalysisPrompt } from './prompts/material-analysis';
import { buildTeachingPrompt } from './prompts/teaching';
import { buildEvaluationPrompt } from './prompts/evaluation';
import { buildAdaptiveTeachingPrompt } from './prompts/adaptive-teaching';
import { buildQuizPrompt } from './prompts/quiz';

export class GeminiAIProvider implements AIProvider {
  public name = 'Google Gemini (Gemini 2.5/3.0)';
  private aiClient: GoogleGenAI | null = null;

  private getClient(): GoogleGenAI {
    if (!this.aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        throw new Error(
          'GEMINI_API_KEY is not configured. Please supply a valid Gemini API key in the environment.'
        );
      }
      this.aiClient = new GoogleGenAI({ apiKey });
    }
    return this.aiClient;
  }

  async analyzeMaterial(text: string, originalFileName: string): Promise<MaterialAnalysisResult> {
    const ai = this.getClient();
    const prompt = buildMaterialAnalysisPrompt(text, originalFileName);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '{}';
    try {
      return JSON.parse(responseText) as MaterialAnalysisResult;
    } catch {
      throw new Error('Failed to parse structured material analysis from Gemini response.');
    }
  }

  async teachConcept(input: TeachingTurnInput): Promise<TeachingTurnOutput> {
    const ai = this.getClient();
    const prompt = buildTeachingPrompt(input);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '{}';
    try {
      const parsed = JSON.parse(responseText);
      return {
        explanation: parsed.explanation || '',
        groundedCheckQuestion: parsed.groundedCheckQuestion || 'How would you explain this concept in your own words?',
        pedagogicalRationale: parsed.pedagogicalRationale || '',
        strategyUsed: (parsed.strategyUsed as TeachingStrategy) || input.strategy,
        isGroundedInMaterial: parsed.isGroundedInMaterial !== false,
        citationExcerpts: parsed.citationExcerpts || [],
      };
    } catch {
      return {
        explanation: responseText,
        groundedCheckQuestion: 'What is the main takeaway you understood so far?',
        pedagogicalRationale: 'Fallback conversational response',
        strategyUsed: input.strategy,
        isGroundedInMaterial: true,
        citationExcerpts: [],
      };
    }
  }

  async evaluateUnderstanding(input: EvaluationInput): Promise<EvaluationOutput> {
    const ai = this.getClient();
    const prompt = buildEvaluationPrompt(input);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '{}';
    try {
      const parsed = JSON.parse(responseText);
      return {
        level: (parsed.level as UnderstandingLevel) || 'PARTIALLY_UNDERSTOOD',
        score: typeof parsed.score === 'number' ? parsed.score : 60,
        correctnessAnalysis: parsed.correctnessAnalysis || 'Evaluated understanding from student explanation.',
        conceptualUnderstandingScore: parsed.conceptualUnderstandingScore || 60,
        completenessScore: parsed.completenessScore || 60,
        misconceptions: Array.isArray(parsed.misconceptions) ? parsed.misconceptions : [],
        evidenceFound: Array.isArray(parsed.evidenceFound) ? parsed.evidenceFound : [],
        recommendedStrategy: (parsed.recommendedStrategy as TeachingStrategy) || 'REAL_WORLD_ANALOGY',
        recommendedAction: parsed.recommendedAction || 'Reinforce with a clear analogy.',
        encouragingFeedback: parsed.encouragingFeedback || 'Good attempt. Let us refine the core idea together.',
      };
    } catch {
      return {
        level: 'PARTIALLY_UNDERSTOOD',
        score: 50,
        correctnessAnalysis: 'Basic evaluation fallback.',
        conceptualUnderstandingScore: 50,
        completenessScore: 50,
        misconceptions: [],
        evidenceFound: [],
        recommendedStrategy: 'STEP_BY_STEP',
        recommendedAction: 'Break concept down into smaller steps.',
        encouragingFeedback: 'Keep going! Let us take it one step at a time.',
      };
    }
  }

  async generateAdaptiveExplanation(
    input: TeachingTurnInput & { misconception: string; newStrategy: TeachingStrategy }
  ): Promise<TeachingTurnOutput> {
    const ai = this.getClient();
    const prompt = buildAdaptiveTeachingPrompt(input);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '{}';
    try {
      const parsed = JSON.parse(responseText);
      return {
        explanation: parsed.explanation || '',
        groundedCheckQuestion: parsed.groundedCheckQuestion || 'Does this new angle help clarify the distinction?',
        pedagogicalRationale: parsed.pedagogicalRationale || 'Adaptive re-teaching loop triggered.',
        strategyUsed: input.newStrategy,
        isGroundedInMaterial: true,
        citationExcerpts: parsed.citationExcerpts || [],
      };
    } catch {
      return {
        explanation: responseText,
        groundedCheckQuestion: 'How does this new perspective make sense to you?',
        pedagogicalRationale: 'Adaptive fallback',
        strategyUsed: input.newStrategy,
        isGroundedInMaterial: true,
        citationExcerpts: [],
      };
    }
  }

  async generateQuiz(input: QuizGenerationInput): Promise<Partial<Quiz>> {
    const ai = this.getClient();
    const prompt = buildQuizPrompt(input);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = response.text || '{}';
    try {
      return JSON.parse(responseText) as Partial<Quiz>;
    } catch {
      throw new Error('Failed to parse generated quiz from Gemini response.');
    }
  }
}
