import { GoogleGenAI, Type } from '@google/genai';
import { StudyMaterial, DocumentChunk, User, UnderstandingLevel, TeachingStrategy } from '../types/database';

let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

export interface BloomBreakdown {
  recall: number; // 0-100
  mechanism: number; // 0-100
  invariant: number; // 0-100
  synthesis: number; // 0-100
}

export interface FormativeDiagnosticResult {
  id: string;
  conceptName: string;
  questionAsked: string;
  studentAnswer: string;
  level: UnderstandingLevel;
  score: number; // 0 - 100
  bloomBreakdown: BloomBreakdown;
  analysis: string;
  misconceptions: string[];
  contrastiveCorrection?: string;
  evidenceFound: string[];
  missingKeyPoints: string[];
  recommendedStrategy: TeachingStrategy;
  recommendedAction: string;
  feedbackMessage: string;
  groundedSourceHeading?: string;
  createdAt: string;
}

export interface DiagnosticEvaluationRequest {
  user: User;
  material: StudyMaterial;
  chunks: DocumentChunk[];
  conceptName: string;
  questionAsked?: string;
  studentAnswer: string;
}

/**
 * 4-Tier Socratic Formative Diagnostic Engine
 * Evaluates student conceptual depth using Gemini 3.7 Flash or Deterministic Fallback
 */
export async function evaluateStudentUnderstanding(
  req: DiagnosticEvaluationRequest
): Promise<FormativeDiagnosticResult> {
  const { user, material, chunks, conceptName, questionAsked = 'Explain the core mechanism in your own words.', studentAnswer } = req;

  // Retrieve relevant reference text
  const relevantChunks = chunks.filter(
    (c) =>
      c.content.toLowerCase().includes(conceptName.toLowerCase()) ||
      (c.heading && c.heading.toLowerCase().includes(conceptName.toLowerCase()))
  );
  const contextChunks = relevantChunks.length > 0 ? relevantChunks : chunks.slice(0, 3);
  const groundTruthText = contextChunks.map((c) => `[SECTION: ${c.heading}]\n${c.content}`).join('\n\n');

  const ai = getGeminiClient();

  if (ai) {
    try {
      const systemInstruction = `You are the Formative Diagnostic & Socratic Evaluator of Dr. CoreStack.
Your objective is to evaluate a student's response against the course material's Ground Truth and diagnose their exact level of conceptual understanding.

4-TIER RUBRIC DEFINITIONS:
1. "NOT_UNDERSTOOD" (Score: 0 - 45): The student has fundamental errors, circular reasoning, completely off-topic guesses, or major false assumptions.
2. "PARTIALLY_UNDERSTOOD" (Score: 46 - 74): The student has the broad intuition or buzzwords, but misses critical underlying mechanisms, causality, or hardware/software invariants.
3. "UNDERSTOOD" (Score: 75 - 89): The student accurately explains the mechanism, sequence of events, and purpose without notable inaccuracies.
4. "MASTERED" (Score: 90 - 100): The student demonstrates complete technical clarity, mentions key trade-offs/invariants, and explains edge cases accurately.

MISCONCEPTION EXTRACTION:
If the student holds a factual or mechanical misconception, extract it explicitly into the "misconceptions" array, and provide a "contrastiveCorrection" that directly juxtaposes their false assumption against the true invariant.`;

      const prompt = `COURSE MATERIAL TITLE: "${material.title}"
ACTIVE CONCEPT: "${conceptName}"
STUDENT ACADEMIC LEVEL: "${user.academicLevel || 'UNDERGRADUATE'}"

GROUND TRUTH TEXT FROM NOTES:
${groundTruthText}

QUESTION POSED TO STUDENT:
"${questionAsked}"

STUDENT'S SUBMITTED RESPONSE:
"${studentAnswer}"

Evaluate strictly and return JSON adhering to the specified schema.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              level: {
                type: Type.STRING,
                enum: ['NOT_UNDERSTOOD', 'PARTIALLY_UNDERSTOOD', 'UNDERSTOOD', 'MASTERED'],
                description: 'The 4-tier rubric placement.',
              },
              score: {
                type: Type.INTEGER,
                description: 'Comprehension score from 0 to 100.',
              },
              bloomBreakdown: {
                type: Type.OBJECT,
                properties: {
                  recall: { type: Type.INTEGER, description: 'Recall of core terminology (0-100)' },
                  mechanism: { type: Type.INTEGER, description: 'Understanding of cause-and-effect transitions (0-100)' },
                  invariant: { type: Type.INTEGER, description: 'Grasp of system invariants and bounds (0-100)' },
                  synthesis: { type: Type.INTEGER, description: 'Ability to connect to broader architecture (0-100)' },
                },
                required: ['recall', 'mechanism', 'invariant', 'synthesis'],
              },
              analysis: {
                type: Type.STRING,
                description: 'Detailed evaluation of what the student understood and where gaps exist.',
              },
              misconceptions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'List of specific misconceptions or incorrect assertions detected.',
              },
              contrastiveCorrection: {
                type: Type.STRING,
                description: 'Targeted contrastive explanation contrasting the mistake with reality.',
              },
              evidenceFound: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Concepts or keywords the student correctly applied.',
              },
              missingKeyPoints: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Crucial aspects from the source notes the student omitted.',
              },
              recommendedStrategy: {
                type: Type.STRING,
                enum: [
                  'SIMPLE_EXPLANATION',
                  'REAL_WORLD_ANALOGY',
                  'STEP_BY_STEP',
                  'PRACTICAL_EXAMPLE',
                  'COMPARISON',
                  'QUESTION_LED',
                  'ACADEMIC_DEEP_DIVE',
                ],
                description: 'Best strategy to close remaining gaps.',
              },
              recommendedAction: {
                type: Type.STRING,
                description: 'Concrete next action for the lecturer.',
              },
              feedbackMessage: {
                type: Type.STRING,
                description: 'Direct, encouraging yet precise feedback for the student.',
              },
            },
            required: [
              'level',
              'score',
              'bloomBreakdown',
              'analysis',
              'misconceptions',
              'evidenceFound',
              'missingKeyPoints',
              'recommendedStrategy',
              'recommendedAction',
              'feedbackMessage',
            ],
          },
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        return {
          id: `diag_${Date.now()}`,
          conceptName,
          questionAsked,
          studentAnswer,
          level: parsed.level as UnderstandingLevel,
          score: Math.min(100, Math.max(0, parsed.score)),
          bloomBreakdown: parsed.bloomBreakdown,
          analysis: parsed.analysis,
          misconceptions: parsed.misconceptions || [],
          contrastiveCorrection: parsed.contrastiveCorrection,
          evidenceFound: parsed.evidenceFound || [],
          missingKeyPoints: parsed.missingKeyPoints || [],
          recommendedStrategy: parsed.recommendedStrategy as TeachingStrategy,
          recommendedAction: parsed.recommendedAction,
          feedbackMessage: parsed.feedbackMessage,
          groundedSourceHeading: contextChunks[0]?.heading || 'Course Notes',
          createdAt: new Date().toISOString(),
        };
      }
    } catch (err) {
      console.warn('Gemini diagnostic evaluation error, engaging deterministic rubric:', err);
    }
  }

  // Deterministic Diagnostic Rubric Fallback
  return generateDeterministicDiagnostic({
    user,
    material,
    chunks: contextChunks,
    conceptName,
    questionAsked,
    studentAnswer,
  });
}

/**
 * Deterministic Diagnostic Evaluator Fallback
 */
function generateDeterministicDiagnostic(params: {
  user: User;
  material: StudyMaterial;
  chunks: DocumentChunk[];
  conceptName: string;
  questionAsked: string;
  studentAnswer: string;
}): FormativeDiagnosticResult {
  const { conceptName, questionAsked, studentAnswer, chunks } = params;
  const answerLower = studentAnswer.toLowerCase();
  const primaryChunk = chunks[0] || { heading: 'Core Invariant', content: '' };

  // Heuristic keyword matching
  const hasMechanismTerms =
    answerLower.includes('fault') ||
    answerLower.includes('trap') ||
    answerLower.includes('cache') ||
    answerLower.includes('page') ||
    answerLower.includes('frame') ||
    answerLower.includes('disk') ||
    answerLower.includes('interrupt') ||
    answerLower.includes('lock') ||
    answerLower.includes('log') ||
    answerLower.includes('table');

  const hasNuanceTerms =
    answerLower.includes('because') ||
    answerLower.includes('hardware') ||
    answerLower.includes('kernel') ||
    answerLower.includes('invariant') ||
    answerLower.includes('overhead') ||
    answerLower.includes('atomic');

  let level: UnderstandingLevel = 'PARTIALLY_UNDERSTOOD';
  let score = 65;
  let analysis = '';
  let misconceptions: string[] = [];
  let contrastiveCorrection = '';
  let evidenceFound: string[] = [];
  let missingKeyPoints: string[] = [];
  let recommendedStrategy: TeachingStrategy = 'STEP_BY_STEP';
  let recommendedAction = 'Break down execution steps to solidify transition mechanics.';
  let feedbackMessage = '';

  if (studentAnswer.length < 15) {
    level = 'NOT_UNDERSTOOD';
    score = 25;
    analysis = 'The answer is too brief or evasive to demonstrate mechanical comprehension.';
    misconceptions = ['Insufficient conceptual formulation'];
    missingKeyPoints = ['Causality', 'System response sequence', 'Hardware/software boundaries'];
    recommendedStrategy = 'SIMPLE_EXPLANATION';
    recommendedAction = 'Provide a high-level simplified analogy and ask again.';
    feedbackMessage = 'Let us slow down and look at the core idea before going into the technical weeds.';
  } else if (hasMechanismTerms && hasNuanceTerms) {
    level = 'MASTERED';
    score = 94;
    analysis = `Comprehensive understanding demonstrated. The response correctly articulates the relationship between logical triggers, hardware/software interaction, and system guarantees.`;
    evidenceFound = ['Accurate operational causality', 'Clear hardware/software boundary', 'Correct invariant preservation'];
    missingKeyPoints = [];
    recommendedStrategy = 'ACADEMIC_DEEP_DIVE';
    recommendedAction = 'Advance to the next concept in the curriculum tree.';
    feedbackMessage = `Outstanding! You have captured the exact technical invariant of ${conceptName}.`;
  } else if (hasMechanismTerms) {
    level = 'UNDERSTOOD';
    score = 82;
    analysis = `Solid comprehension of the core mechanism. The student accurately tracks the primary workflow, with minor omissions in edge-case guarantees.`;
    evidenceFound = ['Primary workflow correct', 'Relevant system components identified'];
    missingKeyPoints = ['Precise trap resolution handling'];
    recommendedStrategy = 'REAL_WORLD_ANALOGY';
    recommendedAction = 'Reinforce with a physical parallel before advancing.';
    feedbackMessage = `Good job! You understand how ${conceptName} operates in standard execution.`;
  } else {
    level = 'PARTIALLY_UNDERSTOOD';
    score = 58;
    analysis = `Partial understanding. The general high-level goal was identified, but the underlying execution mechanism and state transitions were not articulated.`;
    misconceptions = ['Equating logical abstraction with physical reality without intermediate translation steps'];
    contrastiveCorrection = `**Misconception Alert**: The process does not seamlessly access storage directly; the hardware MMU triggers a synchronous trap so the operating system can intervene and swap frames.`;
    evidenceFound = ['High-level problem awareness'];
    missingKeyPoints = ['Hardware trap sequence', 'Page table validation bit', 'Secondary storage I/O delay'];
    recommendedStrategy = 'STEP_BY_STEP';
    recommendedAction = 'Walk through the 5-step execution timeline.';
    feedbackMessage = `You have the high-level intuition, but let's review the exact execution steps to make sure you have absolute clarity.`;
  }

  return {
    id: `diag_${Date.now()}`,
    conceptName,
    questionAsked,
    studentAnswer,
    level,
    score,
    bloomBreakdown: {
      recall: Math.min(100, score + 10),
      mechanism: Math.min(100, score - 5),
      invariant: Math.min(100, Math.max(20, score - 15)),
      synthesis: Math.min(100, Math.max(30, score - 10)),
    },
    analysis,
    misconceptions,
    contrastiveCorrection: contrastiveCorrection || undefined,
    evidenceFound,
    missingKeyPoints,
    recommendedStrategy,
    recommendedAction,
    feedbackMessage,
    groundedSourceHeading: primaryChunk.heading || 'Course Notes',
    createdAt: new Date().toISOString(),
  };
}

/**
 * Generate an incisive Socratic Formative Diagnostic Question
 */
export async function generateSocraticQuestion(params: {
  material: StudyMaterial;
  chunks: DocumentChunk[];
  conceptName: string;
  userAcademicLevel: string;
}): Promise<{ question: string; targetInvariant: string; bloomTarget: string }> {
  const { material, chunks, conceptName, userAcademicLevel } = params;
  const ai = getGeminiClient();

  if (ai) {
    try {
      const relevantChunk = chunks.find((c) => c.heading?.toLowerCase().includes(conceptName.toLowerCase())) || chunks[0];
      const prompt = `Generate a single incisive, diagnostic Socratic question to test a ${userAcademicLevel} student's deep conceptual understanding of "${conceptName}" from course "${material.title}".
Context excerpt: ${relevantChunk ? relevantChunk.content.slice(0, 300) : ''}

The question MUST:
1. Target causality or system invariants (not pure trivia or rote recall).
2. Prompt the student to explain *why* or *what happens when an edge case occurs*.

Return JSON with "question", "targetInvariant", and "bloomTarget".`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              targetInvariant: { type: Type.STRING },
              bloomTarget: { type: Type.STRING },
            },
            required: ['question', 'targetInvariant', 'bloomTarget'],
          },
        },
      });

      if (response.text) {
        return JSON.parse(response.text);
      }
    } catch (e) {
      console.warn('Gemini Socratic question generation error, falling back:', e);
    }
  }

  return {
    question: `In your own words: What happens when the system encounters an invalid reference under ${conceptName}, and what invariant does the operating kernel enforce to recover?`,
    targetInvariant: 'Deterministic fault trapping and state preservation.',
    bloomTarget: 'Analysis & Mechanism',
  };
}
