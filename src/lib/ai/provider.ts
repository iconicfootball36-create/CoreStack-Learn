/**
 * AI Provider Abstraction Interface
 * Decouples CoreStack Learn from specific LLM providers
 */

import {
  Concept,
  Course,
  TeachingStrategy,
  Topic,
  UnderstandingEvaluation,
  UnderstandingLevel,
  Quiz,
  QuestionType,
} from '@/src/types/database';

export interface MaterialAnalysisResult {
  subject: string;
  courseTitle: string;
  courseDescription: string;
  topics: Array<{
    title: string;
    description: string;
    estimatedMinutes: number;
    orderIndex: number;
    concepts: Array<{
      title: string;
      definition: string;
      keyPoints: string[];
      difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
      orderIndex: number;
    }>;
  }>;
}

export interface TeachingTurnInput {
  topic: Topic;
  concept: Concept;
  studentName: string;
  strategy: TeachingStrategy;
  conversationHistory: Array<{ role: 'user' | 'lecturer' | 'system'; content: string }>;
  groundedMaterialExcerpt: string;
  studentTrigger?: string;
  previousMisconception?: string;
}

export interface TeachingTurnOutput {
  explanation: string;
  groundedCheckQuestion: string;
  pedagogicalRationale: string;
  strategyUsed: TeachingStrategy;
  isGroundedInMaterial: boolean;
  citationExcerpts: string[];
}

export interface EvaluationInput {
  concept: Concept;
  questionAsked: string;
  studentAnswer: string;
  groundedSourceText: string;
  previousEvaluations?: UnderstandingEvaluation[];
}

export interface EvaluationOutput {
  level: UnderstandingLevel;
  score: number;
  correctnessAnalysis: string;
  conceptualUnderstandingScore: number;
  completenessScore: number;
  misconceptions: string[];
  evidenceFound: string[];
  recommendedStrategy: TeachingStrategy;
  recommendedAction: string;
  encouragingFeedback: string;
}

export interface QuizGenerationInput {
  topicTitle: string;
  concepts: Concept[];
  groundedMaterial: string;
  targetQuestionCount: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'ADAPTIVE';
  preferredQuestionTypes?: QuestionType[];
}

export interface AIProvider {
  name: string;
  analyzeMaterial(text: string, originalFileName: string): Promise<MaterialAnalysisResult>;
  teachConcept(input: TeachingTurnInput): Promise<TeachingTurnOutput>;
  evaluateUnderstanding(input: EvaluationInput): Promise<EvaluationOutput>;
  generateAdaptiveExplanation(
    input: TeachingTurnInput & { misconception: string; newStrategy: TeachingStrategy }
  ): Promise<TeachingTurnOutput>;
  generateQuiz(input: QuizGenerationInput): Promise<Partial<Quiz>>;
}
