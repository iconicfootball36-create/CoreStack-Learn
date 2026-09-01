/**
 * Understanding Evaluation Service
 * Evaluates student answers and updates mastery levels
 */

import { EvaluationInput, EvaluationOutput } from './provider';
import { getAIProvider } from './teaching';
import { UnderstandingLevel } from '@/src/types/database';

export async function evaluateStudentResponse(input: EvaluationInput): Promise<EvaluationOutput> {
  const provider = getAIProvider();
  return provider.evaluateUnderstanding(input);
}

export function calculateMasteryProgress(
  previousScore: number,
  newEvaluation: EvaluationOutput,
  totalAttempts: number
): {
  newPercentage: number;
  level: UnderstandingLevel;
  isWeakArea: boolean;
} {
  // Mastery is evidence-based, not single-answer pass/fail
  const scoreWeight = 0.4;
  const conceptualWeight = 0.35;
  const completenessWeight = 0.25;

  const currentScore =
    newEvaluation.score * scoreWeight +
    newEvaluation.conceptualUnderstandingScore * conceptualWeight +
    newEvaluation.completenessScore * completenessWeight;

  const smoothed =
    totalAttempts <= 1
      ? currentScore
      : Math.round(previousScore * 0.4 + currentScore * 0.6);

  let level: UnderstandingLevel = 'NOT_UNDERSTOOD';
  if (smoothed >= 90) level = 'MASTERED';
  else if (smoothed >= 75) level = 'UNDERSTOOD';
  else if (smoothed >= 45) level = 'PARTIALLY_UNDERSTOOD';
  else level = 'NOT_UNDERSTOOD';

  const isWeakArea =
    level === 'NOT_UNDERSTOOD' ||
    (level === 'PARTIALLY_UNDERSTOOD' && totalAttempts >= 2);

  return {
    newPercentage: Math.min(100, Math.max(0, smoothed)),
    level,
    isWeakArea,
  };
}
