/**
 * Understanding Evaluation Prompt Builder
 * Analyzes student replies for true conceptual understanding vs rote memorization/misconceptions
 */

import { EvaluationInput } from '../provider';

export function buildEvaluationPrompt(input: EvaluationInput): string {
  return `You are CoreStack Learn's Cognitive Understanding Evaluator.

Evaluate student's answer against the target concept.

TARGET CONCEPT:
Title: "${input.concept.title}"
Definition: "${input.concept.definition}"
Key Points: ${input.concept.keyPoints.join('; ')}

QUESTION ASKED:
"${input.questionAsked}"

STUDENT'S SUBMITTED ANSWER:
"${input.studentAnswer}"

GROUNDED SOURCE TEXT:
"""
${input.groundedSourceText}
"""

EVALUATION CRITERIA:
1. Level:
   - "MASTERED": Complete mastery, can apply conceptually with no gaps.
   - "UNDERSTOOD": Accurate grasp of core concept, minor details missing.
   - "PARTIALLY_UNDERSTOOD": Has some correct ideas but holds a specific misconception or incomplete foundation.
   - "NOT_UNDERSTOOD": Incorrect, confused, or irrelevant answer.
2. Score: 0 to 100
3. Identify exact misconceptions (if any).
4. Evidence found in student reply.
5. Recommend next pedagogical strategy (e.g. REAL_WORLD_ANALOGY, STEP_BY_STEP, COMPARISON, PRACTICAL_EXAMPLE, SIMPLE_EXPLANATION).

OUTPUT STRICT JSON FORMAT:
{
  "level": "UNDERSTOOD | PARTIALLY_UNDERSTOOD | NOT_UNDERSTOOD | MASTERED",
  "score": 85,
  "correctnessAnalysis": "Detailed analytical breakdown of student's answer",
  "conceptualUnderstandingScore": 85,
  "completenessScore": 80,
  "misconceptions": ["List of misconceptions identified"],
  "evidenceFound": ["What the student got right"],
  "recommendedStrategy": "REAL_WORLD_ANALOGY",
  "recommendedAction": "Actionable next step for the lecturer",
  "encouragingFeedback": "Warm, encouraging message to the student"
}
`;
}
