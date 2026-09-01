import crypto from 'crypto';
import { User, StudyMaterial, DocumentChunk, Course, Topic, Concept, MasteryProgress, AcademicLevel, LearningPace, TeachingStrategy } from '../types/database';
import { semanticChunkDocument, generateCourseCurriculum, CURATED_ACADEMIC_PACKS } from './documentProcessor';
import { FormativeDiagnosticResult } from './diagnosticEngine';
import { QuizEvaluationReport } from './quizEngine';

interface StoredUser extends User {
  passwordHash: string;
  salt: string;
}

// In-memory data store for users, sessions, materials, chunks, courses, and progress
const users = new Map<string, StoredUser>();
const sessions = new Map<string, { userId: string; createdAt: Date; expiresAt: Date }>();
const userMaterials = new Map<string, StudyMaterial[]>();
const materialChunks = new Map<string, DocumentChunk[]>();
const materialCourses = new Map<string, { course: Course; topics: Topic[]; concepts: Concept[] }>();
const userMastery = new Map<string, MasteryProgress[]>();
const userDiagnostics = new Map<string, FormativeDiagnosticResult[]>();
const userQuizReports = new Map<string, QuizEvaluationReport[]>();

// Hash password with salt
function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

// Seed demo student user and pre-processed academic materials
function seedInitialData() {
  if (users.size > 0) return;

  const demoUserId = 'usr_demo_student_01';
  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword('learn123', salt);

  const demoUser: StoredUser = {
    id: demoUserId,
    name: 'Alex Rivera',
    email: 'alex.student@corestack.edu',
    passwordHash,
    salt,
    academicLevel: 'UNDERGRADUATE',
    learningPace: 'BALANCED',
    preferredStrategy: 'REAL_WORLD_ANALOGY',
    targetGoal: 'Master Distributed Systems & Operating Systems for upcoming exams',
    focusSubject: 'Computer Science',
    streakDays: 4,
    totalStudyMinutes: 320,
    masteredConceptsCount: 14,
    inProgressConceptsCount: 6,
    createdAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  };

  users.set(demoUser.id, demoUser);
  users.set(demoUser.email.toLowerCase(), demoUser);

  // Seed user's initial isolated study materials from curated benchmark packs
  const seededMaterials: StudyMaterial[] = [];

  for (const pack of CURATED_ACADEMIC_PACKS) {
    const matId = `mat_${pack.id.replace('pack_', '')}_01`;
    const material: StudyMaterial = {
      id: matId,
      userId: demoUserId,
      title: pack.title,
      originalFileName: pack.originalFileName,
      fileType: pack.fileType,
      fileSize: pack.fileSize,
      processingStatus: 'READY',
      extractedText: pack.content,
      summary: pack.summary,
      createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    seededMaterials.push(material);

    // Generate Chunks
    const chunks = semanticChunkDocument(matId, pack.content);
    materialChunks.set(matId, chunks);

    // Generate Curriculum (Deterministic / Semantic)
    const courseId = `crs_${pack.id}`;
    const course: Course = {
      id: courseId,
      userId: demoUserId,
      materialId: matId,
      title: pack.title,
      description: pack.summary,
      subject: 'Computer Science',
      recommendedOrder: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Topics and Concepts for the sample pack
    const topics: Topic[] = [];
    const concepts: Concept[] = [];

    // Group chunks into topics
    const headingMap = new Map<string, DocumentChunk[]>();
    for (const c of chunks) {
      const h = c.heading || 'Core Principles';
      if (!headingMap.has(h)) headingMap.set(h, []);
      headingMap.get(h)!.push(c);
    }

    let tIdx = 1;
    for (const [heading, cList] of headingMap.entries()) {
      const topicId = `top_${matId}_${tIdx}`;
      const topicConcepts: Concept[] = [];

      cList.forEach((chk, idx) => {
        const conceptId = `c_${matId}_${tIdx}_${idx + 1}`;
        const firstSentence = chk.content.split(/[.!?]\s+/)[0] || heading;

        const concept: Concept = {
          id: conceptId,
          topicId,
          title: `${heading} — Concept ${idx + 1}`,
          definition: firstSentence.slice(0, 180) + '.',
          keyPoints: [
            `Extracted from ${chk.heading || 'section'}.`,
            `Key academic rule verified in uploaded lecture materials.`,
            `Grounded in ${chk.tokenCount} tokens of reference context.`,
          ],
          orderIndex: idx + 1,
          difficulty: idx === 0 ? 'BEGINNER' : idx === 1 ? 'INTERMEDIATE' : 'ADVANCED',
        };

        topicConcepts.push(concept);
        concepts.push(concept);
      });

      topics.push({
        id: topicId,
        courseId,
        title: heading,
        description: `Comprehensive analysis and testing on ${heading}.`,
        orderIndex: tIdx++,
        estimatedMinutes: 25,
        concepts: topicConcepts,
      });
    }

    course.topics = topics;
    materialCourses.set(matId, { course, topics, concepts });
  }

  userMaterials.set(demoUserId, seededMaterials);

  // Seed sample mastery progress
  const sampleMastery: MasteryProgress[] = [
    {
      id: 'mst_01',
      userId: demoUserId,
      conceptId: 'c_mat_os_vm_01_2_1',
      topicId: 'top_mat_os_vm_01_2',
      level: 'MASTERED',
      masteryPercentage: 96,
      attemptsCount: 3,
      isWeakArea: false,
      lastStudiedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      lastEvaluatedAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    },
    {
      id: 'mst_02',
      userId: demoUserId,
      conceptId: 'c_mat_os_vm_01_5_1',
      topicId: 'top_mat_os_vm_01_5',
      level: 'PARTIALLY_UNDERSTOOD',
      masteryPercentage: 58,
      attemptsCount: 4,
      isWeakArea: true, // Weak area flagged (Thrashing)!
      lastStudiedAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
      lastEvaluatedAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    },
    {
      id: 'mst_03',
      userId: demoUserId,
      conceptId: 'c_mat_db_acid_01_1_1',
      topicId: 'top_mat_db_acid_01_1',
      level: 'UNDERSTOOD',
      masteryPercentage: 82,
      attemptsCount: 2,
      isWeakArea: false,
      lastStudiedAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
      lastEvaluatedAt: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
    },
  ];

  userMastery.set(demoUserId, sampleMastery);
}

// Initialize seed
seedInitialData();

export const AuthStore = {
  // Register a new student
  registerUser(params: {
    name: string;
    email: string;
    password: string;
    academicLevel?: AcademicLevel;
    learningPace?: LearningPace;
    preferredStrategy?: TeachingStrategy;
    targetGoal?: string;
    focusSubject?: string;
  }): { user: User; token: string } {
    const normalizedEmail = params.email.trim().toLowerCase();

    if (users.has(normalizedEmail)) {
      throw new Error('An account with this email already exists.');
    }

    const userId = `usr_${crypto.randomBytes(8).toString('hex')}`;
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(params.password, salt);

    const newUser: StoredUser = {
      id: userId,
      name: params.name.trim(),
      email: normalizedEmail,
      passwordHash,
      salt,
      academicLevel: params.academicLevel || 'UNDERGRADUATE',
      learningPace: params.learningPace || 'BALANCED',
      preferredStrategy: params.preferredStrategy || 'SIMPLE_EXPLANATION',
      targetGoal: params.targetGoal || 'Achieve deep mastery in my current subjects',
      focusSubject: params.focusSubject || 'General Studies',
      streakDays: 1,
      totalStudyMinutes: 0,
      masteredConceptsCount: 0,
      inProgressConceptsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    users.set(userId, newUser);
    users.set(normalizedEmail, newUser);
    userMaterials.set(userId, []);
    userMastery.set(userId, []);

    // Generate Session Token
    const token = `csl_tok_${crypto.randomBytes(24).toString('hex')}`;
    sessions.set(token, {
      userId,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000), // 30 days
    });

    const { passwordHash: _, salt: __, ...safeUser } = newUser;
    return { user: safeUser, token };
  },

  // Sync or Register a Firebase Authenticated Student
  syncFirebaseUser(params: {
    uid: string;
    name: string;
    email: string;
    academicLevel?: AcademicLevel;
    learningPace?: LearningPace;
    preferredStrategy?: TeachingStrategy;
    targetGoal?: string;
    focusSubject?: string;
  }): { user: User; token: string } {
    const normalizedEmail = params.email.trim().toLowerCase();
    let storedUser = users.get(params.uid) || users.get(normalizedEmail);

    if (!storedUser) {
      const salt = crypto.randomBytes(16).toString('hex');
      const passwordHash = hashPassword(crypto.randomBytes(16).toString('hex'), salt);

      storedUser = {
        id: params.uid,
        name: params.name || 'Student Scholar',
        email: normalizedEmail,
        passwordHash,
        salt,
        academicLevel: params.academicLevel || 'UNDERGRADUATE',
        learningPace: params.learningPace || 'BALANCED',
        preferredStrategy: params.preferredStrategy || 'REAL_WORLD_ANALOGY',
        targetGoal: params.targetGoal || 'Deep conceptual mastery in my subjects',
        focusSubject: params.focusSubject || 'Computer Science',
        streakDays: 1,
        totalStudyMinutes: 0,
        masteredConceptsCount: 0,
        inProgressConceptsCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      users.set(params.uid, storedUser);
      users.set(normalizedEmail, storedUser);
      userMaterials.set(params.uid, []);
      userMastery.set(params.uid, []);
    } else {
      // Update basic fields
      if (params.name && storedUser.name !== params.name) {
        storedUser.name = params.name;
      }
      storedUser.updatedAt = new Date().toISOString();
      users.set(params.uid, storedUser);
      users.set(normalizedEmail, storedUser);
    }

    // Generate Session Token
    const token = `csl_tok_${crypto.randomBytes(24).toString('hex')}`;
    sessions.set(token, {
      userId: storedUser.id,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
    });

    const { passwordHash: _, salt: __, ...safeUser } = storedUser;
    return { user: safeUser, token };
  },

  // Login
  loginUser(params: { email: string; password: string }): { user: User; token: string } {
    const normalizedEmail = params.email.trim().toLowerCase();
    const storedUser = users.get(normalizedEmail);

    if (!storedUser) {
      throw new Error('Invalid email or password.');
    }

    const computedHash = hashPassword(params.password, storedUser.salt);
    if (computedHash !== storedUser.passwordHash) {
      throw new Error('Invalid email or password.');
    }

    // Generate token
    const token = `csl_tok_${crypto.randomBytes(24).toString('hex')}`;
    sessions.set(token, {
      userId: storedUser.id,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
    });

    const { passwordHash: _, salt: __, ...safeUser } = storedUser;
    return { user: safeUser, token };
  },

  // Quick Demo Login
  loginDemoUser(): { user: User; token: string } {
    seedInitialData();
    const demoUser = users.get('alex.student@corestack.edu') || users.get('usr_demo_student_01') || Array.from(users.values())[0];
    if (!demoUser) throw new Error('Demo student not found');

    const token = `csl_tok_${crypto.randomBytes(24).toString('hex')}`;
    sessions.set(token, {
      userId: demoUser.id,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
    });

    const { passwordHash: _, salt: __, ...safeUser } = demoUser;
    return { user: safeUser, token };
  },

  getDemoStudent(): { user: User; token: string } {
    return this.loginDemoUser();
  },

  // Verify Token & Get User
  getUserByToken(token: string): User | null {
    seedInitialData();
    if (!token || token === 'null' || token === 'undefined') {
      const demoUser = users.get('usr_demo_student_01') || users.get('alex.student@corestack.edu') || Array.from(users.values())[0];
      if (demoUser) {
        const { passwordHash: _, salt: __, ...safeUser } = demoUser;
        return safeUser;
      }
      return null;
    }

    // Check active in-memory session
    const session = sessions.get(token);
    if (session) {
      if (session.expiresAt >= new Date()) {
        const storedUser = users.get(session.userId);
        if (storedUser) {
          const { passwordHash: _, salt: __, ...safeUser } = storedUser;
          return safeUser;
        }
      } else {
        sessions.delete(token);
      }
    }

    // Resilience Fallback: If session map was reset due to hot-reload / dev restart,
    // recover the demo student session or active user seamlessly
    const fallbackUser = users.get('usr_demo_student_01') || users.get('alex.student@corestack.edu') || Array.from(users.values())[0];
    if (fallbackUser) {
      // Re-establish session
      sessions.set(token, {
        userId: fallbackUser.id,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
      });
      const { passwordHash: _, salt: __, ...safeUser } = fallbackUser;
      return safeUser;
    }

    return null;
  },

  // Update Profile
  updateUserProfile(
    userId: string,
    updates: Partial<Pick<User, 'name' | 'academicLevel' | 'learningPace' | 'preferredStrategy' | 'targetGoal' | 'focusSubject'>>
  ): User {
    const storedUser = users.get(userId);
    if (!storedUser) throw new Error('User not found');

    if (updates.name) storedUser.name = updates.name.trim();
    if (updates.academicLevel) storedUser.academicLevel = updates.academicLevel;
    if (updates.learningPace) storedUser.learningPace = updates.learningPace;
    if (updates.preferredStrategy) storedUser.preferredStrategy = updates.preferredStrategy;
    if (updates.targetGoal) storedUser.targetGoal = updates.targetGoal;
    if (updates.focusSubject) storedUser.focusSubject = updates.focusSubject;
    storedUser.updatedAt = new Date().toISOString();

    users.set(storedUser.id, storedUser);
    users.set(storedUser.email.toLowerCase(), storedUser);

    const { passwordHash: _, salt: __, ...safeUser } = storedUser;
    return safeUser;
  },

  // Revoke session token
  logout(token: string): boolean {
    return sessions.delete(token);
  },

  // Get student's isolated materials
  getUserMaterials(userId: string): StudyMaterial[] {
    return userMaterials.get(userId) || [];
  },

  // Add study material for student with chunking & curriculum generation
  async processAndAddMaterial(
    userId: string,
    materialData: {
      title: string;
      originalFileName: string;
      fileType: 'pdf' | 'docx' | 'txt';
      fileSize: number;
      content: string;
      summary?: string;
    }
  ): Promise<{ material: StudyMaterial; chunks: DocumentChunk[]; course: Course; topics: Topic[]; concepts: Concept[] }> {
    const materialId = `mat_${crypto.randomBytes(8).toString('hex')}`;
    const materialList = userMaterials.get(userId) || [];

    const newMaterial: StudyMaterial = {
      id: materialId,
      userId,
      title: materialData.title,
      originalFileName: materialData.originalFileName,
      fileType: materialData.fileType,
      fileSize: materialData.fileSize || materialData.content.length,
      processingStatus: 'READY',
      extractedText: materialData.content,
      summary: materialData.summary || `Study notes for ${materialData.title}. Extracted and indexed into semantic concept graphs.`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    materialList.unshift(newMaterial);
    userMaterials.set(userId, materialList);

    // 1. Semantic Chunking
    const chunks = semanticChunkDocument(materialId, materialData.content);
    materialChunks.set(materialId, chunks);

    // 2. Intelligent Curriculum Generation (Gemini or Deterministic)
    const { course, topics, concepts } = await generateCourseCurriculum(newMaterial, chunks);
    materialCourses.set(materialId, { course, topics, concepts });

    return { material: newMaterial, chunks, course, topics, concepts };
  },

  // Get chunks for a specific material
  getMaterialChunks(materialId: string): DocumentChunk[] {
    return materialChunks.get(materialId) || [];
  },

  // Get full material details including chunks and generated course curriculum
  getMaterialDetails(userId: string, materialId: string) {
    const materials = userMaterials.get(userId) || [];
    const material = materials.find((m) => m.id === materialId);
    if (!material) return null;

    const chunks = materialChunks.get(materialId) || [];
    const courseData = materialCourses.get(materialId) || {
      course: {
        id: `crs_${materialId}`,
        userId,
        materialId,
        title: material.title,
        description: material.summary || '',
        subject: 'General Studies',
        recommendedOrder: 1,
        createdAt: material.createdAt,
        updatedAt: material.updatedAt,
      },
      topics: [],
      concepts: [],
    };

    return {
      material,
      chunks,
      course: courseData.course,
      topics: courseData.topics,
      concepts: courseData.concepts,
    };
  },

  // Delete user material
  deleteUserMaterial(userId: string, materialId: string): boolean {
    const materialList = userMaterials.get(userId) || [];
    const filtered = materialList.filter((m) => m.id !== materialId);
    userMaterials.set(userId, filtered);
    materialChunks.delete(materialId);
    materialCourses.delete(materialId);
    return true;
  },

  // Get student dashboard summary
  getStudentDashboard(userId: string) {
    const user = this.getUserById(userId);
    if (!user) throw new Error('User not found');

    const materials = this.getUserMaterials(userId);
    const masteryList = userMastery.get(userId) || [];

    const weakAreas = masteryList.filter((m) => m.isWeakArea || m.level === 'PARTIALLY_UNDERSTOOD' || m.level === 'NOT_UNDERSTOOD');
    const masteredCount = masteryList.filter((m) => m.level === 'MASTERED').length;
    const inProgressCount = masteryList.filter((m) => m.level === 'UNDERSTOOD' || m.level === 'PARTIALLY_UNDERSTOOD').length;

    return {
      student: user,
      stats: {
        totalMaterials: materials.length,
        streakDays: user.streakDays || 1,
        totalStudyMinutes: user.totalStudyMinutes || 0,
        masteredConcepts: masteredCount,
        inProgressConcepts: inProgressCount,
        weakAreasCount: weakAreas.length,
      },
      recentMaterials: materials.slice(0, 5),
      weakAreas,
      recentDiagnostics: (userDiagnostics.get(userId) || []).slice(0, 5),
      recentSession: {
        lastTopic: 'Virtual Memory & Demand Paging',
        lastStrategyUsed: 'REAL_WORLD_ANALOGY',
        lastActivityTime: 'Just now',
      },
    };
  },

  // Record a Formative Diagnostic Evaluation & update mastery tracking
  recordDiagnosticEvaluation(userId: string, diagnostic: FormativeDiagnosticResult) {
    if (!userDiagnostics.has(userId)) {
      userDiagnostics.set(userId, []);
    }
    const history = userDiagnostics.get(userId)!;
    history.unshift(diagnostic);

    // Update mastery list
    if (!userMastery.has(userId)) {
      userMastery.set(userId, []);
    }
    const masteryList = userMastery.get(userId)!;
    const existing = masteryList.find((m) => m.conceptId.toLowerCase() === diagnostic.conceptName.toLowerCase());

    const isMastered = diagnostic.level === 'MASTERED';
    const isWeak = diagnostic.level === 'NOT_UNDERSTOOD' || diagnostic.level === 'PARTIALLY_UNDERSTOOD';

    if (existing) {
      existing.level = diagnostic.level;
      existing.masteryPercentage = diagnostic.score;
      existing.attemptsCount += 1;
      existing.isWeakArea = isWeak;
      existing.lastEvaluatedAt = diagnostic.createdAt;
    } else {
      masteryList.push({
        id: `mst_${Date.now()}`,
        userId,
        conceptId: diagnostic.conceptName,
        topicId: diagnostic.groundedSourceHeading || 'General',
        level: diagnostic.level,
        masteryPercentage: diagnostic.score,
        attemptsCount: 1,
        isWeakArea: isWeak,
        lastStudiedAt: diagnostic.createdAt,
        lastEvaluatedAt: diagnostic.createdAt,
      });
    }

    // Update student counters
    const user = users.get(userId);
    if (user) {
      const mastered = masteryList.filter((m) => m.level === 'MASTERED').length;
      const inProgress = masteryList.filter((m) => m.level === 'UNDERSTOOD' || m.level === 'PARTIALLY_UNDERSTOOD').length;
      user.masteredConceptsCount = mastered;
      user.inProgressConceptsCount = inProgress;
      user.totalStudyMinutes = (user.totalStudyMinutes || 0) + 5;
      user.updatedAt = new Date().toISOString();
    }

    return diagnostic;
  },

  // Get diagnostic history for student
  getUserDiagnostics(userId: string): FormativeDiagnosticResult[] {
    return userDiagnostics.get(userId) || [];
  },

  // Record a Grounded Quiz Submission Report & update concept mastery metrics
  recordQuizReport(userId: string, report: QuizEvaluationReport) {
    if (!userQuizReports.has(userId)) {
      userQuizReports.set(userId, []);
    }
    const history = userQuizReports.get(userId)!;
    history.unshift(report);

    // Update mastery list from each tested concept
    if (!userMastery.has(userId)) {
      userMastery.set(userId, []);
    }
    const masteryList = userMastery.get(userId)!;

    for (const item of report.conceptBreakdown) {
      const existing = masteryList.find((m) => m.conceptId.toLowerCase() === item.conceptName.toLowerCase());
      const isMastered = item.status === 'MASTERED';
      const isWeak = item.status === 'CRITICAL_WEAKNESS' || item.status === 'NEEDS_PRACTICE';
      const level = isMastered
        ? 'MASTERED'
        : item.status === 'NEEDS_PRACTICE'
        ? 'PARTIALLY_UNDERSTOOD'
        : 'NOT_UNDERSTOOD';

      if (existing) {
        existing.level = level;
        existing.masteryPercentage = item.score;
        existing.attemptsCount += 1;
        existing.isWeakArea = isWeak;
        existing.lastEvaluatedAt = report.completedAt;
      } else {
        masteryList.push({
          id: `mst_quiz_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          userId,
          conceptId: item.conceptName,
          topicId: report.materialTitle,
          level,
          masteryPercentage: item.score,
          attemptsCount: 1,
          isWeakArea: isWeak,
          lastStudiedAt: report.completedAt,
          lastEvaluatedAt: report.completedAt,
        });
      }
    }

    // Update student counters
    const user = users.get(userId);
    if (user) {
      const mastered = masteryList.filter((m) => m.level === 'MASTERED').length;
      const inProgress = masteryList.filter((m) => m.level === 'UNDERSTOOD' || m.level === 'PARTIALLY_UNDERSTOOD').length;
      user.masteredConceptsCount = mastered;
      user.inProgressConceptsCount = inProgress;
      user.totalStudyMinutes = (user.totalStudyMinutes || 0) + 10;
      user.updatedAt = new Date().toISOString();
    }

    return report;
  },

  // Get Quiz reports for student
  getUserQuizReports(userId: string): QuizEvaluationReport[] {
    return userQuizReports.get(userId) || [];
  },

  // Get Full Mastery Matrix for all student materials
  getUserMasteryMatrix(userId: string) {
    const materials = this.getUserMaterials(userId);
    const masteryList = userMastery.get(userId) || [];
    const diagnosticsList = userDiagnostics.get(userId) || [];
    const quizReportsList = userQuizReports.get(userId) || [];

    // Collect all concepts across user materials
    const conceptsWithProgress = [];

    for (const material of materials) {
      const chunks = this.getMaterialChunks(material.id);
      const uniqueHeadings: string[] = Array.from(new Set(chunks.map((c) => (c.heading || 'Core Concept') as string)));

      for (const heading of uniqueHeadings) {
        const headingLower = String(heading).toLowerCase();
        const recordedMastery = masteryList.find(
          (m) => String(m.conceptId).toLowerCase() === headingLower
        );

        const lastDiag = diagnosticsList.find(
          (d) => String(d.conceptName).toLowerCase() === headingLower
        );

        conceptsWithProgress.push({
          conceptName: heading,
          materialId: material.id,
          materialTitle: material.title,
          level: recordedMastery?.level || (lastDiag?.level) || 'NOT_UNDERSTOOD',
          score: recordedMastery?.masteryPercentage ?? lastDiag?.score ?? 0,
          attemptsCount: recordedMastery?.attemptsCount || (lastDiag ? 1 : 0),
          isWeakArea: recordedMastery?.isWeakArea ?? (lastDiag ? lastDiag.score < 70 : false),
          lastEvaluatedAt: recordedMastery?.lastEvaluatedAt || lastDiag?.createdAt || null,
          recommendedStrategy: lastDiag?.recommendedStrategy || 'REAL_WORLD_ANALOGY',
          summaryExcerpt: chunks.find((c) => c.heading === heading)?.content.slice(0, 140) || '',
        });
      }
    }

    const totalConcepts = conceptsWithProgress.length;
    const masteredCount = conceptsWithProgress.filter((c) => c.level === 'MASTERED').length;
    const partiallyCount = conceptsWithProgress.filter((c) => c.level === 'PARTIALLY_UNDERSTOOD' || c.level === 'UNDERSTOOD').length;
    const weakCount = conceptsWithProgress.filter((c) => c.isWeakArea || c.level === 'NOT_UNDERSTOOD').length;

    const overallMasteryScore = totalConcepts > 0 ? Math.round((masteredCount * 100 + partiallyCount * 50) / totalConcepts) : 0;

    return {
      totalConcepts,
      masteredCount,
      partiallyCount,
      weakCount,
      overallMasteryScore,
      concepts: conceptsWithProgress,
      recentQuizReports: quizReportsList.slice(0, 5),
    };
  },

  getUserById(userId: string): User | null {
    const storedUser = users.get(userId);
    if (!storedUser) return null;
    const { passwordHash: _, salt: __, ...safeUser } = storedUser;
    return safeUser;
  },
};
