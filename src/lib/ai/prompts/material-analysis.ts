/**
 * Material Analysis Prompt Builder
 * Extracts subject, course title, ordered topics, and atomic concepts with definitions
 */

export function buildMaterialAnalysisPrompt(text: string, originalFileName: string): string {
  return `You are CoreStack Learn's Lead Curriculum Architect.
Analyze the following student study material extracted from file "${originalFileName}".

STRICT PEDAGOGICAL GROUNDING MANDATE:
1. Extract topics and concepts directly from this text. Do NOT fabricate unrelated subjects.
2. Structure the concepts in a strict pedagogical learning order (foundational -> intermediate -> advanced).
3. Provide crisp definitions and bulleted key points for every concept.

STUDY MATERIAL:
"""
${text.slice(0, 30000)}
"""

OUTPUT FORMAT:
Return strict, valid JSON matching this exact TypeScript structure:
{
  "subject": "string",
  "courseTitle": "string",
  "courseDescription": "string",
  "topics": [
    {
      "title": "string",
      "description": "string",
      "estimatedMinutes": 15,
      "orderIndex": 1,
      "concepts": [
        {
          "title": "string",
          "definition": "string",
          "keyPoints": ["point 1", "point 2"],
          "difficulty": "BEGINNER",
          "orderIndex": 1
        }
      ]
    }
  ]
}
`;
}
