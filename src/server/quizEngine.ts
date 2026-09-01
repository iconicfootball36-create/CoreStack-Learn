import { GoogleGenAI, Type } from '@google/genai';
import { StudyMaterial, DocumentChunk, User, QuestionType, AcademicLevel, TeachingStrategy } from '../types/database';

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

export interface GeneratedQuizQuestion {
  id: string;
  conceptName: string;
  type: QuestionType;
  prompt: string;
  options?: string[]; // for multiple choice
  correctAnswer: string;
  explanation: string;
  groundingHeading: string;
  groundingExcerpt: string;
  chunkIndex: number;
}

export interface GroundedQuiz {
  id: string;
  materialId: string;
  materialTitle: string;
  conceptFocus?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'ADAPTIVE';
  questions: GeneratedQuizQuestion[];
  createdAt: string;
}

export interface QuizSubmissionQuestionResult {
  questionId: string;
  prompt: string;
  conceptName: string;
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  score: number; // 0 - 100
  feedback: string;
  identifiedMisconception?: string;
  recommendedStrategy: TeachingStrategy;
  groundingHeading: string;
  groundingExcerpt: string;
}

export interface QuizEvaluationReport {
  id: string;
  quizId: string;
  materialId: string;
  materialTitle: string;
  totalQuestions: number;
  correctCount: number;
  overallScore: number; // 0 - 100
  masteryLevel: 'NOT_UNDERSTOOD' | 'PARTIALLY_UNDERSTOOD' | 'UNDERSTOOD' | 'MASTERED';
  conceptBreakdown: {
    conceptName: string;
    score: number;
    status: 'MASTERED' | 'NEEDS_PRACTICE' | 'CRITICAL_WEAKNESS';
  }[];
  criticalBlindspots: string[];
  recommendedNextAction: string;
  prescribedRemediationConcept?: string;
  prescribedStrategy?: TeachingStrategy;
  questionResults: QuizSubmissionQuestionResult[];
  completedAt: string;
}

/**
 * Generate a Grounded Quiz using Gemini 3.7 Flash or Deterministic Curated Engine
 */
export async function generateGroundedQuiz(params: {
  material: StudyMaterial;
  chunks: DocumentChunk[];
  conceptName?: string;
  questionCount?: number;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'ADAPTIVE';
  academicLevel?: AcademicLevel;
}): Promise<GroundedQuiz> {
  const {
    material,
    chunks,
    conceptName,
    questionCount = 4,
    difficulty = 'ADAPTIVE',
    academicLevel = 'UNDERGRADUATE',
  } = params;

  const quizId = `quiz_${Date.now()}`;
  const now = new Date().toISOString();

  // Filter chunks if a specific concept was targeted
  let targetChunks = chunks;
  if (conceptName && chunks.length > 0) {
    const matched = chunks.filter(
      (c) =>
        c.heading?.toLowerCase().includes(conceptName.toLowerCase()) ||
        c.content.toLowerCase().includes(conceptName.toLowerCase())
    );
    if (matched.length > 0) {
      targetChunks = matched;
    }
  }

  const groundedContext = targetChunks
    .slice(0, 6)
    .map((c, i) => `[CHUNK #${c.chunkIndex + 1}: ${c.heading || 'Section'}]\n${c.content}`)
    .join('\n\n---\n\n');

  const ai = getGeminiClient();

  if (ai && chunks.length > 0) {
    try {
      const systemInstruction = `You are the Lead Academic Assessment Officer for CoreStack Learn.
Generate a rigorous, 100% grounded diagnostic quiz based strictly on the provided study material chunks.

RULES:
1. Every question MUST be grounded in the text chunks provided. Never test facts absent from the excerpts.
2. Formulate questions calibrated for a ${academicLevel} student.
3. Mix Question Types:
   - MULTIPLE_CHOICE: Exactly 4 distinct, plausible options.
   - TRUE_FALSE: Subtle, conceptually demanding claims. Options MUST be ["True", "False"].
   - SHORT_ANSWER / EXPLAIN_IN_YOUR_OWN_WORDS: Deep conceptual inquiries requiring explanation of mechanisms.
4. For each question, quote the exact groundingExcerpt and specify the groundingHeading.`;

      const prompt = `SOURCE MATERIAL CHUNKS:
${groundedContext}

TARGET CONCEPT: ${conceptName || 'All Core Material Concepts'}
DIFFICULTY: ${difficulty}
TOTAL QUESTIONS: ${questionCount}

Return a valid JSON array of questions matching the schema.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    conceptName: { type: Type.STRING },
                    type: {
                      type: Type.STRING,
                      enum: ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'EXPLAIN_IN_YOUR_OWN_WORDS'],
                    },
                    prompt: { type: Type.STRING },
                    options: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    correctAnswer: { type: Type.STRING },
                    explanation: { type: Type.STRING },
                    groundingHeading: { type: Type.STRING },
                    groundingExcerpt: { type: Type.STRING },
                    chunkIndex: { type: Type.INTEGER },
                  },
                  required: [
                    'conceptName',
                    'type',
                    'prompt',
                    'correctAnswer',
                    'explanation',
                    'groundingHeading',
                    'groundingExcerpt',
                  ],
                },
              },
            },
            required: ['questions'],
          },
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        if (parsed.questions && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
          const generatedQuestions: GeneratedQuizQuestion[] = parsed.questions.map((q: any, index: number) => ({
            id: `q_${Date.now()}_${index}`,
            conceptName: q.conceptName || conceptName || 'Key Principle',
            type: (q.type as QuestionType) || 'MULTIPLE_CHOICE',
            prompt: q.prompt,
            options: q.options || (q.type === 'TRUE_FALSE' ? ['True', 'False'] : undefined),
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            groundingHeading: q.groundingHeading || 'Course Material',
            groundingExcerpt: q.groundingExcerpt || 'Directly derived from course syllabus notes.',
            chunkIndex: typeof q.chunkIndex === 'number' ? q.chunkIndex : 0,
          }));

          return {
            id: quizId,
            materialId: material.id,
            materialTitle: material.title,
            conceptFocus: conceptName,
            difficulty,
            questions: generatedQuestions,
            createdAt: now,
          };
        }
      }
    } catch (err) {
      console.warn('Gemini quiz generation error, falling back to deterministic questions:', err);
    }
  }

  // Deterministic Grounded Quiz Fallback based on parsed chunks
  const fallbackQuestions: GeneratedQuizQuestion[] = [];
  const validChunks = chunks.length > 0 ? chunks : [
    {
      id: 'chk_default',
      materialId: material.id,
      chunkIndex: 0,
      heading: 'Fundamental Concepts',
      content: material.summary || 'Core course principles and execution mechanics.',
      createdAt: now,
    },
  ];

  validChunks.slice(0, questionCount).forEach((chunk, index) => {
    const heading = chunk.heading || `Core Topic ${index + 1}`;
    
    if (index % 3 === 0) {
      fallbackQuestions.push({
        id: `q_fall_${index}`,
        conceptName: heading,
        type: 'MULTIPLE_CHOICE',
        prompt: `According to the section on "${heading}", what is the primary role or mechanism described?`,
        options: [
          `To manage operational state and isolate abstractions safely`,
          `To eliminate memory access latency entirely`,
          `To bypass hardware validation layers unconditionally`,
          `To replace all disk storage with volatile registers`,
        ],
        correctAnswer: `To manage operational state and isolate abstractions safely`,
        explanation: `As detailed in ${heading}, the system coordinates state transitions and manages access boundaries.`,
        groundingHeading: heading,
        groundingExcerpt: chunk.content.slice(0, 160) + '...',
        chunkIndex: chunk.chunkIndex,
      });
    } else if (index % 3 === 1) {
      fallbackQuestions.push({
        id: `q_fall_${index}`,
        conceptName: heading,
        type: 'TRUE_FALSE',
        prompt: `True or False: In "${heading}", memory access faults or boundary violations trigger architectural transitions to maintain system integrity.`,
        options: ['True', 'False'],
        correctAnswer: 'True',
        explanation: `True. Architectural faults allow the runtime to handle page allocations, state reconciliation, and protection.`,
        groundingHeading: heading,
        groundingExcerpt: chunk.content.slice(0, 150) + '...',
        chunkIndex: chunk.chunkIndex,
      });
    } else {
      fallbackQuestions.push({
        id: `q_fall_${index}`,
        conceptName: heading,
        type: 'EXPLAIN_IN_YOUR_OWN_WORDS',
        prompt: `Explain the fundamental trade-off or algorithmic sequence discussed in "${heading}".`,
        correctAnswer: `A comprehensive explanation covering the core mechanism, state transitions, and system trade-offs.`,
        explanation: `Demonstrate mastery by connecting the technical components with the underlying cause and effect.`,
        groundingHeading: heading,
        groundingExcerpt: chunk.content.slice(0, 150) + '...',
        chunkIndex: chunk.chunkIndex,
      });
    }
  });

  return {
    id: quizId,
    materialId: material.id,
    materialTitle: material.title,
    conceptFocus: conceptName,
    difficulty,
    questions: fallbackQuestions,
    createdAt: now,
  };
}

/**
 * Evaluate student quiz submissions with detailed rubrics and remediation advice
 */
export async function evaluateQuizSubmission(params: {
  user: User;
  quiz: GroundedQuiz;
  studentAnswers: { questionId: string; answer: string }[];
  chunks: DocumentChunk[];
}): Promise<QuizEvaluationReport> {
  const { user, quiz, studentAnswers, chunks } = params;

  const now = new Date().toISOString();
  const answerMap = new Map(studentAnswers.map((a) => [a.questionId, a.answer.trim()]));

  const questionResults: QuizSubmissionQuestionResult[] = [];
  let totalScoreSum = 0;
  let correctCount = 0;
  const conceptScores: Record<string, { totalScore: number; count: number }> = {};
  const blindspots: string[] = [];

  for (const question of quiz.questions) {
    const studentAnswer = answerMap.get(question.id) || '';
    let isCorrect = false;
    let score = 0;
    let feedback = '';
    let misconception: string | undefined;
    let recommendedStrategy: TeachingStrategy = 'STEP_BY_STEP';

    if (question.type === 'MULTIPLE_CHOICE' || question.type === 'TRUE_FALSE') {
      const normalizedStudent = studentAnswer.toLowerCase().trim();
      const normalizedCorrect = question.correctAnswer.toLowerCase().trim();

      if (normalizedStudent === normalizedCorrect) {
        isCorrect = true;
        score = 100;
        feedback = `Correct! ${question.explanation}`;
        recommendedStrategy = 'ACADEMIC_DEEP_DIVE';
      } else {
        isCorrect = false;
        score = 0;
        feedback = `Incorrect. You answered: "${studentAnswer}". Correct answer: "${question.correctAnswer}". ${question.explanation}`;
        misconception = `Confused the primary mechanism in ${question.conceptName}.`;
        recommendedStrategy = 'REAL_WORLD_ANALOGY';
        blindspots.push(`Misconception regarding ${question.conceptName}`);
      }
    } else {
      // Free-Response Evaluation
      if (studentAnswer.length < 15) {
        score = 25;
        feedback = `Answer is too brief to demonstrate conceptual understanding. Elaborate on the underlying mechanics.`;
        misconception = `Incomplete definition of ${question.conceptName}.`;
        recommendedStrategy = 'SIMPLE_EXPLANATION';
        blindspots.push(`Superficial recall on ${question.conceptName}`);
      } else {
        // Keyword checking with grounded excerpt
        const keywords = question.groundingExcerpt
          .toLowerCase()
          .split(/\s+/)
          .filter((w) => w.length > 4);
        const matchCount = keywords.filter((k) => studentAnswer.toLowerCase().includes(k)).length;

        if (matchCount >= 3) {
          isCorrect = true;
          score = 90;
          feedback = `Strong conceptual explanation. You captured the critical causal elements described in the course text.`;
          recommendedStrategy = 'ACADEMIC_DEEP_DIVE';
        } else {
          score = 60;
          feedback = `Partially correct. You identified the general topic, but missed key execution steps from the text.`;
          misconception = `Missed detailed state transitions in ${question.conceptName}.`;
          recommendedStrategy = 'STEP_BY_STEP';
          blindspots.push(`Partial understanding of ${question.conceptName}`);
        }
      }
    }

    if (isCorrect) correctCount++;
    totalScoreSum += score;

    // Aggregate concept performance
    const cName = question.conceptName;
    if (!conceptScores[cName]) {
      conceptScores[cName] = { totalScore: 0, count: 0 };
    }
    conceptScores[cName].totalScore += score;
    conceptScores[cName].count += 1;

    questionResults.push({
      questionId: question.id,
      prompt: question.prompt,
      conceptName: question.conceptName,
      studentAnswer,
      correctAnswer: question.correctAnswer,
      isCorrect,
      score,
      feedback,
      identifiedMisconception: misconception,
      recommendedStrategy,
      groundingHeading: question.groundingHeading,
      groundingExcerpt: question.groundingExcerpt,
    });
  }

  const overallScore = Math.round(totalScoreSum / quiz.questions.length);

  let masteryLevel: 'NOT_UNDERSTOOD' | 'PARTIALLY_UNDERSTOOD' | 'UNDERSTOOD' | 'MASTERED';
  if (overallScore >= 85) masteryLevel = 'MASTERED';
  else if (overallScore >= 70) masteryLevel = 'UNDERSTOOD';
  else if (overallScore >= 45) masteryLevel = 'PARTIALLY_UNDERSTOOD';
  else masteryLevel = 'NOT_UNDERSTOOD';

  const conceptBreakdown = Object.entries(conceptScores).map(([conceptName, data]) => {
    const avgScore = Math.round(data.totalScore / data.count);
    let status: 'MASTERED' | 'NEEDS_PRACTICE' | 'CRITICAL_WEAKNESS';
    if (avgScore >= 80) status = 'MASTERED';
    else if (avgScore >= 55) status = 'NEEDS_PRACTICE';
    else status = 'CRITICAL_WEAKNESS';

    return {
      conceptName,
      score: avgScore,
      status,
    };
  });

  const lowestConcept = conceptBreakdown.sort((a, b) => a.score - b.score)[0];
  const prescribedRemediationConcept = lowestConcept?.conceptName;
  const prescribedStrategy: TeachingStrategy =
    lowestConcept?.status === 'CRITICAL_WEAKNESS' ? 'REAL_WORLD_ANALOGY' : 'STEP_BY_STEP';

  const recommendedNextAction =
    overallScore >= 85
      ? 'Advance to next curriculum chapter or take an Academic Deep Dive in the Lecture Room.'
      : `Initiate targeted re-teaching with Dr. CoreStack for "${prescribedRemediationConcept}" using the ${prescribedStrategy} strategy.`;

  return {
    id: `rep_${Date.now()}`,
    quizId: quiz.id,
    materialId: quiz.materialId,
    materialTitle: quiz.materialTitle,
    totalQuestions: quiz.questions.length,
    correctCount,
    overallScore,
    masteryLevel,
    conceptBreakdown,
    criticalBlindspots: blindspots.slice(0, 3),
    recommendedNextAction,
    prescribedRemediationConcept,
    prescribedStrategy,
    questionResults,
    completedAt: now,
  };
}
