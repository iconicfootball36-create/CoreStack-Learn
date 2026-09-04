import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { AuthStore } from './src/server/authStore';
import { CURATED_ACADEMIC_PACKS } from './src/server/documentProcessor';
import { generateLecturerResponse } from './src/server/lecturerEngine';
import { evaluateStudentUnderstanding, generateSocraticQuestion } from './src/server/diagnosticEngine';
import { generateGroundedQuiz, evaluateQuizSubmission } from './src/server/quizEngine';
import { generateAcademicStudyBriefing } from './src/server/exportEngine';

// Extend Express Request type for authenticated user
interface AuthenticatedRequest extends Request {
  user?: any;
}

// Authentication middleware
function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : '';

  if (!token || token === 'null' || token === 'undefined') {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  const user = AuthStore.getUserByToken(token);
  if (user) {
    req.user = user;
    return next();
  }

  return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Support large document uploads (PDF text dumps, base64 data, etc.)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'CoreStack Learn API',
      phase: 'PHASE_2_AUTH_OPERATIONAL',
      version: '1.2.0-auth',
      timestamp: new Date().toISOString(),
      capabilities: {
        databaseSchema: 'Prisma PostgreSQL Schema Ready',
        authentication: 'Phase 2 Student Accounts & Sessions Active',
        materialIsolation: 'Multi-tenant student isolation active',
        aiAbstraction: 'Gemini 2.5/3.0 Service Layer Ready',
        pedagogicalLoop: 'Cognitive Check & Re-teaching Configured',
      },
    });
  });

  // Authentication API Endpoints
  app.post('/api/auth/register', (req, res) => {
    try {
      const { name, email, password, academicLevel, learningPace, preferredStrategy, targetGoal, focusSubject } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required.' });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      }

      const result = AuthStore.registerUser({
        name,
        email,
        password,
        academicLevel,
        learningPace,
        preferredStrategy,
        targetGoal,
        focusSubject,
      });

      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Registration failed.' });
    }
  });

  app.post('/api/auth/login', (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }

      const result = AuthStore.loginUser({ email, password });
      res.json(result);
    } catch (err: any) {
      res.status(401).json({ error: err.message || 'Invalid credentials.' });
    }
  });

  // Firebase Google/Auth Profile Synchronization
  app.post('/api/auth/firebase-sync', (req, res) => {
    try {
      const { uid, id, name, email, academicLevel, learningPace, preferredStrategy, targetGoal, focusSubject } = req.body;
      const targetUid = uid || id;
      if (!targetUid || !email) {
        return res.status(400).json({ error: 'UID and email are required for Firebase synchronization.' });
      }

      const result = AuthStore.syncFirebaseUser({
        uid: targetUid,
        name: name || 'Student Scholar',
        email,
        academicLevel,
        learningPace,
        preferredStrategy,
        targetGoal,
        focusSubject,
      });

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to sync Firebase authenticated user.' });
    }
  });

  app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    res.json({ user: req.user });
  });

  app.put('/api/auth/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    try {
      const updatedUser = AuthStore.updateUserProfile(req.user.id, req.body);
      res.json({ user: updatedUser });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to update profile.' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      AuthStore.logout(token);
    }
    res.json({ message: 'Logged out successfully.' });
  });

  // Protected Student Workspace & Materials API
  app.get('/api/student/dashboard', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    try {
      const dashboard = AuthStore.getStudentDashboard(req.user.id);
      res.json(dashboard);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to load student dashboard.' });
    }
  });

  // Curated Academic Packs listing
  app.get('/api/academic/packs', (req, res) => {
    res.json({
      packs: CURATED_ACADEMIC_PACKS.map(({ content: _, ...pack }) => pack),
    });
  });

  // Load a curated academic benchmark pack into student library
  app.post('/api/student/materials/load-pack', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { packId } = req.body;
      const pack = CURATED_ACADEMIC_PACKS.find((p) => p.id === packId);
      if (!pack) {
        return res.status(404).json({ error: 'Academic pack not found.' });
      }

      const result = await AuthStore.processAndAddMaterial(req.user.id, {
        title: pack.title,
        originalFileName: pack.originalFileName,
        fileType: pack.fileType,
        fileSize: pack.fileSize,
        content: pack.content,
        summary: pack.summary,
      });

      res.status(201).json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to load academic pack.' });
    }
  });

  // Upload student study material (with smart chunking & curriculum graph)
  app.post('/api/student/materials/upload', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { title, originalFileName, fileType, content, summary } = req.body;
      if (!title || !originalFileName || !content) {
        return res.status(400).json({ error: 'Title, file name, and text content are required.' });
      }

      const result = await AuthStore.processAndAddMaterial(req.user.id, {
        title,
        originalFileName,
        fileType: fileType || 'txt',
        fileSize: content.length,
        content,
        summary,
      });

      res.status(201).json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to process and upload material.' });
    }
  });

  // Get full material details with semantic chunks and curriculum tree
  app.get('/api/student/materials/:id/details', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    try {
      const details = AuthStore.getMaterialDetails(req.user.id, req.params.id);
      if (!details) {
        return res.status(404).json({ error: 'Material not found.' });
      }
      res.json(details);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch material details.' });
    }
  });

  app.get('/api/student/materials', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    try {
      const materials = AuthStore.getUserMaterials(req.user.id);
      res.json({ materials });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch materials.' });
    }
  });

  app.post('/api/student/materials', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { title, originalFileName, fileType, fileSize, summary, content } = req.body;
      if (!title || !originalFileName || !fileType) {
        return res.status(400).json({ error: 'Title, file name, and file type are required.' });
      }

      const sampleContent =
        content ||
        `# ${title}\n\n## Overview\n${summary || 'Comprehensive course notes.'}\n\n## Key Mechanics & Rules\nDetailed academic analysis of ${title}.`;

      const result = await AuthStore.processAndAddMaterial(req.user.id, {
        title,
        originalFileName,
        fileType,
        fileSize: fileSize || sampleContent.length,
        content: sampleContent,
        summary,
      });

      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to upload material.' });
    }
  });

  app.delete('/api/student/materials/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    try {
      AuthStore.deleteUserMaterial(req.user.id, req.params.id);
      res.json({ success: true, message: 'Material removed.' });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to delete material.' });
    }
  });

  // Phase 7: Live AI Personal Lecturer (Dr. CoreStack) Interactive Endpoint
  app.post('/api/lecturer/message', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { materialId, message, strategy, conceptName, conversationHistory } = req.body;
      if (!message) {
        return res.status(400).json({ error: 'message is required.' });
      }

      // 1. Fetch user's isolated material
      const userMaterials = AuthStore.getUserMaterials(req.user.id);
      const material = materialId ? userMaterials.find((m) => m.id === materialId) : undefined;
      if (materialId && !material) {
        return res.status(404).json({ error: 'Study material not found in your account.' });
      }

      // 2. Fetch associated document chunks
      const chatMaterial = material || {
        id: 'general-chat',
        userId: req.user.id,
        title: 'General Conversation',
        originalFileName: '',
        fileType: 'txt' as const,
        fileSize: 0,
        processingStatus: 'READY' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const chunks = material ? AuthStore.getMaterialChunks(material.id) : [];

      // 3. Generate adaptive pedagogical response via Gemini 3.7 Flash or Deterministic Engine
      const lecturerResponse = await generateLecturerResponse({
        user: req.user,
        material: chatMaterial,
        chunks,
        conceptName,
        strategy: strategy || 'DEFAULT',
        studentInput: message,
        conversationHistory: conversationHistory || [],
      });

      res.json(lecturerResponse);
    } catch (err: any) {
      console.error('Lecturer endpoint error:', err);
      res.status(500).json({ error: err.message || 'AI Lecturer failed to generate response.' });
    }
  });

  // Phase 8: Formative Understanding Diagnostic & Socratic Rubric Evaluation
  app.post('/api/diagnostic/evaluate', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { materialId, conceptName, questionAsked, studentAnswer } = req.body;
      if (!materialId || !conceptName || !studentAnswer) {
        return res.status(400).json({ error: 'materialId, conceptName, and studentAnswer are required.' });
      }

      // Fetch user's material & chunks
      const userMaterials = AuthStore.getUserMaterials(req.user.id);
      const material = userMaterials.find((m) => m.id === materialId);
      if (!material) {
        return res.status(404).json({ error: 'Study material not found.' });
      }

      const chunks = AuthStore.getMaterialChunks(materialId);

      // Perform Socratic Rubric evaluation
      const diagnosticResult = await evaluateStudentUnderstanding({
        user: req.user,
        material,
        chunks,
        conceptName,
        questionAsked: questionAsked || 'Explain the core principle in your own words.',
        studentAnswer,
      });

      // Persist result and update user mastery tracking
      AuthStore.recordDiagnosticEvaluation(req.user.id, diagnosticResult);

      res.json(diagnosticResult);
    } catch (err: any) {
      console.error('Diagnostic evaluation error:', err);
      res.status(500).json({ error: err.message || 'Diagnostic evaluation failed.' });
    }
  });

  // Generate a targeted Socratic diagnostic question
  app.post('/api/diagnostic/socratic-question', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { materialId, conceptName } = req.body;
      if (!materialId || !conceptName) {
        return res.status(400).json({ error: 'materialId and conceptName are required.' });
      }

      const userMaterials = AuthStore.getUserMaterials(req.user.id);
      const material = userMaterials.find((m) => m.id === materialId);
      if (!material) {
        return res.status(404).json({ error: 'Study material not found.' });
      }

      const chunks = AuthStore.getMaterialChunks(materialId);
      const questionData = await generateSocraticQuestion({
        material,
        chunks,
        conceptName,
        userAcademicLevel: req.user.academicLevel || 'UNDERGRADUATE',
      });

      res.json(questionData);
    } catch (err: any) {
      console.error('Socratic question generation error:', err);
      res.status(500).json({ error: err.message || 'Failed to generate Socratic question.' });
    }
  });

  // Get diagnostic history for authenticated student
  app.get('/api/diagnostic/history', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    try {
      const history = AuthStore.getUserDiagnostics(req.user.id);
      res.json({ history });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to retrieve diagnostic history.' });
    }
  });

  // Phase 10: Grounded Quiz Engine Endpoints
  app.post('/api/quiz/generate', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { materialId, conceptName, questionCount, difficulty } = req.body;
      if (!materialId) {
        return res.status(400).json({ error: 'materialId is required to generate a grounded quiz.' });
      }

      const userMaterials = AuthStore.getUserMaterials(req.user.id);
      const material = userMaterials.find((m) => m.id === materialId);
      if (!material) {
        return res.status(404).json({ error: 'Study material not found.' });
      }

      const chunks = AuthStore.getMaterialChunks(materialId);
      const quiz = await generateGroundedQuiz({
        material,
        chunks,
        conceptName,
        questionCount: questionCount || 4,
        difficulty: difficulty || 'ADAPTIVE',
        academicLevel: req.user.academicLevel || 'UNDERGRADUATE',
      });

      res.json(quiz);
    } catch (err: any) {
      console.error('Quiz generation error:', err);
      res.status(500).json({ error: err.message || 'Failed to generate grounded quiz.' });
    }
  });

  // Submit and evaluate a Grounded Quiz
  app.post('/api/quiz/submit', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { quiz, studentAnswers } = req.body;
      if (!quiz || !studentAnswers || !Array.isArray(studentAnswers)) {
        return res.status(400).json({ error: 'quiz object and studentAnswers array are required.' });
      }

      const chunks = AuthStore.getMaterialChunks(quiz.materialId);
      const evaluationReport = await evaluateQuizSubmission({
        user: req.user,
        quiz,
        studentAnswers,
        chunks,
      });

      // Persist report and update mastery matrix
      AuthStore.recordQuizReport(req.user.id, evaluationReport);

      res.json(evaluationReport);
    } catch (err: any) {
      console.error('Quiz submission evaluation error:', err);
      res.status(500).json({ error: err.message || 'Failed to evaluate quiz submission.' });
    }
  });

  // Retrieve student's quiz attempt reports
  app.get('/api/quiz/history', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    try {
      const reports = AuthStore.getUserQuizReports(req.user.id);
      res.json({ reports });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to retrieve quiz history.' });
    }
  });

  // Phase 11: Mastery Knowledge Matrix & Weakness Tracking
  app.get('/api/mastery/matrix', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    try {
      const matrix = AuthStore.getUserMasteryMatrix(req.user.id);
      res.json(matrix);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to load mastery matrix.' });
    }
  });

  // Phase 12: Academic Study Briefing & Revision Pack Exporter
  app.post('/api/export/study-guide', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { materialId, format } = req.body;
      if (!materialId) {
        return res.status(400).json({ error: 'materialId is required' });
      }

      const userMaterials = AuthStore.getUserMaterials(req.user.id);
      const material = userMaterials.find((m) => m.id === materialId);
      if (!material) {
        return res.status(404).json({ error: 'Study material not found' });
      }

      const chunks = AuthStore.getMaterialChunks(materialId);
      const diagnosticHistory = AuthStore.getUserDiagnostics(req.user.id);
      const quizReports = AuthStore.getUserQuizReports(req.user.id);

      const briefing = await generateAcademicStudyBriefing({
        material,
        chunks,
        user: req.user,
        format: format || 'FULL_STUDY_GUIDE',
        diagnosticHistory,
        quizReports,
      });

      res.json(briefing);
    } catch (err: any) {
      console.error('Study guide export error:', err);
      res.status(500).json({ error: err.message || 'Failed to generate academic study briefing.' });
    }
  });

  app.get('/api/architecture', (req, res) => {
    res.json({
      productName: 'CoreStack Learn',
      vision: 'Learn Until You Understand',
      database: {
        orm: 'Prisma',
        models: [
          'User',
          'StudyMaterial',
          'DocumentChunk',
          'Course',
          'Topic',
          'Concept',
          'LearningSession',
          'ConversationMessage',
          'UnderstandingEvaluation',
          'Quiz',
          'QuizQuestion',
          'StudentAnswer',
          'MasteryProgress',
        ],
      },
      teachingStrategies: [
        'SIMPLE_EXPLANATION',
        'REAL_WORLD_ANALOGY',
        'STEP_BY_STEP',
        'PRACTICAL_EXAMPLE',
        'COMPARISON',
        'QUESTION_LED',
        'ACADEMIC_DEEP_DIVE',
      ],
      cognitiveLoop: [
        'UPLOAD',
        'UNDERSTAND MATERIAL',
        'CREATE LEARNING PLAN',
        'TEACH',
        'ASK QUESTIONS',
        'CHECK UNDERSTANDING',
        'IDENTIFY WEAKNESSES',
        'RE-TEACH DIFFERENTLY',
        'PRACTICE',
        'RE-EVALUATE',
        'MASTER',
      ],
    });
  });

  app.get('/api/roadmap', (req, res) => {
    res.json({
      currentPhase: 12,
      phases: [
        { phase: 1, name: 'Foundation & Architecture', status: 'COMPLETED' },
        { phase: 2, name: 'Authentication & Student Accounts (Firebase + Cloud Sync)', status: 'COMPLETED' },
        { phase: 3, name: 'Student Dashboard & Isolated Library', status: 'COMPLETED' },
        { phase: 4, name: 'Material Ingestion (PDF, DOCX, TXT)', status: 'COMPLETED' },
        { phase: 5, name: 'Document Processing & Smart Chunking', status: 'COMPLETED' },
        { phase: 6, name: 'Gemini Material Intelligence & Curriculum Plan', status: 'COMPLETED' },
        { phase: 7, name: 'AI Lecturer & Conversational Engine (Dr. CoreStack)', status: 'COMPLETED' },
        { phase: 8, name: 'Understanding Detection Engine & Socratic Rubrics', status: 'COMPLETED' },
        { phase: 9, name: 'Adaptive Re-teaching System (7 Pedagogical Strategies)', status: 'COMPLETED' },
        { phase: 10, name: 'Grounded Quiz Engine & Active Mastery Testing', status: 'COMPLETED' },
        { phase: 11, name: 'Mastery Knowledge Matrix & Weakness Remediation', status: 'COMPLETED' },
        { phase: 12, name: 'Production Polish & Release (Academic Exporter & Quick Actions)', status: 'COMPLETED' },
      ],
    });
  });

  // Vite middleware for development vs static dist for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const workingDistPath = path.join(process.cwd(), 'dist');
    const bundledDistPath = path.dirname(process.argv[1]);
    const distPath = fs.existsSync(path.join(workingDistPath, 'index.html'))
      ? workingDistPath
      : bundledDistPath;
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CoreStack Learn server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
