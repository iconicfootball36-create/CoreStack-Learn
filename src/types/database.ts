/**
 * CoreStack Learn - Database and Core Domain Types
 * Defines the complete data architecture for CoreStack Learn
 */

export type Role = 'user' | 'lecturer' | 'system';

export type MaterialProcessingStatus = 'UPLOADED' | 'PROCESSING' | 'READY' | 'FAILED';

export type FileType = 'pdf' | 'docx' | 'txt';

export type UnderstandingLevel = 
  | 'NOT_UNDERSTOOD'
  | 'PARTIALLY_UNDERSTOOD'
  | 'UNDERSTOOD'
  | 'MASTERED';

export type TeachingStrategy =
  | 'SIMPLE_EXPLANATION'
  | 'REAL_WORLD_ANALOGY'
  | 'STEP_BY_STEP'
  | 'PRACTICAL_EXAMPLE'
  | 'COMPARISON'
  | 'QUESTION_LED'
  | 'ACADEMIC_DEEP_DIVE';

export type StudentActionControl =
  | 'EXPLAIN_SIMPLY'
  | 'GIVE_EXAMPLE'
  | 'EXPLAIN_ANOTHER_WAY'
  | 'GO_DEEPER'
  | 'DONT_UNDERSTAND'
  | 'ASK_QUESTION';

export type QuestionType =
  | 'MULTIPLE_CHOICE'
  | 'TRUE_FALSE'
  | 'SHORT_ANSWER'
  | 'EXPLAIN_IN_YOUR_OWN_WORDS';

export type AcademicLevel = 'HIGH_SCHOOL' | 'UNDERGRADUATE' | 'GRADUATE' | 'PROFESSIONAL';
export type LearningPace = 'FAST' | 'BALANCED' | 'DEEP_DIVE';

export interface UserPreferences {
  academicLevel: AcademicLevel;
  learningPace: LearningPace;
  preferredStrategy: TeachingStrategy;
  targetGoal: string;
  focusSubject?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  academicLevel?: AcademicLevel;
  learningPace?: LearningPace;
  preferredStrategy?: TeachingStrategy;
  targetGoal?: string;
  focusSubject?: string;
  streakDays?: number;
  totalStudyMinutes?: number;
  masteredConceptsCount?: number;
  inProgressConceptsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface StudyMaterial {
  id: string;
  userId: string;
  title: string;
  originalFileName: string;
  fileType: FileType;
  fileSize: number;
  storageUrl?: string;
  processingStatus: MaterialProcessingStatus;
  extractedText?: string;
  summary?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentChunk {
  id: string;
  materialId: string;
  chunkIndex: number;
  content: string;
  tokenCount?: number;
  heading?: string;
  section?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface Course {
  id: string;
  userId: string;
  materialId: string;
  title: string;
  description: string;
  subject: string;
  recommendedOrder: number;
  createdAt: string;
  updatedAt: string;
  topics?: Topic[];
}

export interface Topic {
  id: string;
  courseId: string;
  title: string;
  description: string;
  orderIndex: number;
  estimatedMinutes?: number;
  concepts?: Concept[];
}

export interface Concept {
  id: string;
  topicId: string;
  title: string;
  definition: string;
  keyPoints: string[];
  orderIndex: number;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
}

export interface LearningSession {
  id: string;
  userId: string;
  topicId: string;
  activeConceptId?: string;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  currentStrategy: TeachingStrategy;
  startedAt: string;
  completedAt?: string;
  messages?: ConversationMessage[];
}

export interface ConversationMessage {
  id: string;
  sessionId: string;
  sender: Role;
  content: string;
  messageType: 'EXPLANATION' | 'QUESTION' | 'STUDENT_REPLY' | 'EVALUATION' | 'RE_TEACHING' | 'ACTION_TRIGGER';
  metadata?: {
    conceptId?: string;
    strategyUsed?: TeachingStrategy;
    evaluationResult?: UnderstandingEvaluation;
    isGroundedInMaterial?: boolean;
    sourceReferences?: string[];
  };
  createdAt: string;
}

export interface UnderstandingEvaluation {
  id: string;
  sessionId: string;
  conceptId: string;
  studentAnswer: string;
  level: UnderstandingLevel;
  score: number; // 0 to 100
  correctnessAnalysis: string;
  conceptualUnderstandingScore: number;
  completenessScore: number;
  misconceptions: string[];
  evidenceFound: string[];
  recommendedStrategy: TeachingStrategy;
  recommendedAction: string;
  createdAt: string;
}

export interface Quiz {
  id: string;
  topicId: string;
  userId: string;
  title: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'ADAPTIVE';
  questions: QuizQuestion[];
  createdAt: string;
}

export interface QuizQuestion {
  id: string;
  quizId: string;
  conceptId?: string;
  type: QuestionType;
  prompt: string;
  options?: string[]; // for multiple choice
  correctAnswer: string;
  explanation: string;
  groundingExcerpt: string;
}

export interface StudentAnswer {
  id: string;
  quizId: string;
  questionId: string;
  userId: string;
  submittedAnswer: string;
  isCorrect: boolean;
  score: number;
  feedback: string;
  createdAt: string;
}

export interface MasteryProgress {
  id: string;
  userId: string;
  conceptId: string;
  topicId: string;
  level: UnderstandingLevel;
  masteryPercentage: number; // 0 to 100
  attemptsCount: number;
  isWeakArea: boolean;
  lastStudiedAt: string;
  lastEvaluatedAt: string;
}
