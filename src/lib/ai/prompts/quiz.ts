/**
 * Quiz Generation Prompt Builder
 * Generates grounded quiz questions from student material
 */

import { QuizGenerationInput } from '../provider';

export function buildQuizPrompt(input: QuizGenerationInput): string {
  return `You are CoreStack Learn's Assessment Engine.
Generate a high-quality, grounded quiz for Topic: "${input.topicTitle}".

TARGET DIFFICULTY: ${input.difficulty}
TARGET QUESTION COUNT: ${input.targetQuestionCount}

CONCEPTS IN THIS TOPIC:
${input.concepts.map((c, i) => `${i + 1}. ${c.title}: ${c.definition}`).join('\n')}

SOURCE MATERIAL:
"""
${input.groundedMaterial}
"""

RULES:
1. Every question MUST be grounded in the provided source material.
2. Provide thoughtful distractors for multiple choice.
3. Provide a thorough, educational explanation for why the correct answer is right and where in the text it comes from.

OUTPUT STRICT JSON FORMAT:
{
  "title": "Quiz: ${input.topicTitle}",
  "difficulty": "${input.difficulty}",
  "questions": [
    {
      "type": "MULTIPLE_CHOICE",
      "prompt": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Detailed explanation of why A is correct",
      "groundingExcerpt": "Exact excerpt from source material confirming the answer"
    }
  ]
}
`;
}
