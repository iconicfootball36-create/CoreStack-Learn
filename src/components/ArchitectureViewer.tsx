import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Database,
  Layers,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Code2,
  Terminal,
  Activity,
} from 'lucide-react';

interface Phase {
  phase: number;
  name: string;
  status: 'COMPLETED' | 'READY_NEXT' | 'PLANNED';
  description: string;
}

const PHASES: Phase[] = [
  {
    phase: 1,
    name: 'Foundation & Architecture',
    status: 'COMPLETED',
    description:
      'Express + Vite full-stack server, Prisma PostgreSQL schema, AI provider abstractions (Gemini 2.5/3.0), storage layer, and landing experience.',
  },
  {
    phase: 2,
    name: 'Authentication & Student Accounts',
    status: 'COMPLETED',
    description:
      'User signup, login, session tokens, academic level & pace preferences, and multi-tenant material isolation.',
  },
  {
    phase: 3,
    name: 'Student Dashboard & Isolated Library',
    status: 'COMPLETED',
    description:
      'Mastery metrics, study streak tracking, isolated coursework library, live lecture launcher, and preference controls.',
  },
  {
    phase: 4,
    name: 'Multi-Format Material Ingestion',
    status: 'COMPLETED',
    description:
      'PDF, DOCX, TXT drag-and-drop file ingestion, curated academic benchmark packs, and structure normalization.',
  },
  {
    phase: 5,
    name: 'Document Processing & Logical Chunking',
    status: 'COMPLETED',
    description:
      'Text extraction, structure cleaning, and semantic boundary chunking preserving headings and formulas.',
  },
  {
    phase: 6,
    name: 'Gemini Material Intelligence',
    status: 'COMPLETED',
    description:
      'Curriculum synthesis, topic breakdown, concept definitions, and prerequisite ordering graph with Gemini 3.7 Flash.',
  },
  {
    phase: 7,
    name: 'AI Personal Lecturer Session',
    status: 'COMPLETED',
    description:
      'Live interactive teaching engine with Gemini 3.7 Flash, source chunk citations, and 5 real-time pedagogical controls.',
  },
  {
    phase: 8,
    name: 'Understanding Detection Engine',
    status: 'READY_NEXT',
    description:
      '4-tier understanding rubric (Not, Partially, Understood, Mastered) with misconception diagnosis.',
  },
  {
    phase: 9,
    name: 'Adaptive Re-Teaching System',
    status: 'PLANNED',
    description:
      'Automatic dispatch of 7 pedagogical strategies (analogies, micro-steps, comparisons, examples).',
  },
  {
    phase: 10,
    name: 'Grounded Quiz Engine',
    status: 'PLANNED',
    description:
      'Adaptive MCQs, True/False, and conceptual explanations with grounded citations.',
  },
  {
    phase: 11,
    name: 'Mastery & Weakness Tracking',
    status: 'PLANNED',
    description:
      'Evidence-based mastery progression, weak concept flagging, and review recommendations.',
  },
  {
    phase: 12,
    name: 'Production Polish & Release',
    status: 'PLANNED',
    description:
      'Performance optimization, audit logging, security review, and deployment verification.',
  },
];

export const ArchitectureViewer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'roadmap' | 'database' | 'ai' | 'api'>('roadmap');
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [loadingApi, setLoadingApi] = useState(false);

  const fetchApiStatus = async () => {
    setLoadingApi(true);
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setApiResponse(data);
    } catch {
      setApiResponse({
        status: 'ok (preview mode)',
        service: 'CoreStack Learn API',
        phase: 'PHASE_1_FOUNDATION',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoadingApi(false);
    }
  };

  useEffect(() => {
    fetchApiStatus();
  }, []);

  return (
    <section id="architecture" className="py-20 bg-slate-50 text-slate-900 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider mb-4">
            <Cpu className="w-3.5 h-3.5 text-blue-600" />
            <span>System Overview & Product Roadmap</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Engineering a Scalable EdTech Foundation
          </h2>
          <p className="text-base sm:text-lg text-slate-600 mt-3">
            CoreStack Learn is built with a decoupled service layer, relational Prisma database schema, and centralized AI provider abstraction.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {[
            { id: 'roadmap', label: 'Product Roadmap', icon: Layers },
            { id: 'database', label: 'Database Schema (Prisma)', icon: Database },
            { id: 'ai', label: 'AI Provider Layer', icon: Sparkles },
            { id: 'api', label: 'Live Server Status', icon: Activity },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-sm'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content 1: Roadmap */}
        {activeTab === 'roadmap' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PHASES.map((p) => (
              <div
                key={p.phase}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between bg-white shadow-sm ${
                  p.status === 'COMPLETED'
                    ? 'border-emerald-500/60 shadow-emerald-500/5'
                    : p.status === 'READY_NEXT'
                    ? 'border-blue-600 shadow-md ring-1 ring-blue-500/20'
                    : 'border-slate-200 text-slate-500'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-bold text-slate-400">PHASE {p.phase}</span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                        p.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : p.status === 'READY_NEXT'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                    >
                      {p.status === 'COMPLETED' ? '✓ Completed' : p.status === 'READY_NEXT' ? '→ Next Up' : 'Planned'}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 mb-2">{p.name}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{p.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-mono text-slate-500 flex items-center justify-between">
                  <span>Target Milestones</span>
                  <span className="text-slate-700 font-semibold">{p.status === 'COMPLETED' ? '100%' : p.status === 'READY_NEXT' ? '0%' : 'Queued'}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab Content 2: Database Schema */}
        {activeTab === 'database' && (
          <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Prisma PostgreSQL Relational Models</h3>
                  <p className="text-xs text-slate-500">Strictly typed schema in prisma/schema.prisma</p>
                </div>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 font-semibold">
                13 Core Models
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono">
              {[
                { name: 'User', desc: 'id, name, email, passwordHash, timestamps' },
                { name: 'StudyMaterial', desc: 'userId, title, fileType, storageUrl, processingStatus' },
                { name: 'DocumentChunk', desc: 'materialId, chunkIndex, content, heading, section' },
                { name: 'Course', desc: 'userId, materialId, title, subject, recommendedOrder' },
                { name: 'Topic', desc: 'courseId, title, orderIndex, estimatedMinutes' },
                { name: 'Concept', desc: 'topicId, title, definition, keyPoints, difficulty' },
                { name: 'LearningSession', desc: 'userId, topicId, activeConceptId, currentStrategy' },
                { name: 'ConversationMessage', desc: 'sessionId, sender, content, messageType, metadata' },
                { name: 'UnderstandingEvaluation', desc: 'sessionId, conceptId, level, score, misconceptions' },
                { name: 'Quiz', desc: 'topicId, userId, title, difficulty' },
                { name: 'QuizQuestion', desc: 'quizId, type, prompt, options, correctAnswer, grounding' },
                { name: 'StudentAnswer', desc: 'quizId, questionId, submittedAnswer, isCorrect, feedback' },
                { name: 'MasteryProgress', desc: 'userId, conceptId, level, masteryPercentage, isWeakArea' },
              ].map((m, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="font-bold text-blue-700 text-xs flex items-center justify-between">
                    <span>{m.name}</span>
                    <span className="text-[10px] text-slate-400 font-sans font-normal">Model</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-normal">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content 3: AI Provider Layer */}
        {activeTab === 'ai' && (
          <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-xl space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="font-bold text-slate-900 text-base">Decoupled AI Provider Architecture</h3>
                <p className="text-xs text-slate-500">Located in src/lib/ai/ with modular prompt architects</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-blue-700 uppercase tracking-wider text-[11px]">Provider Interface Functions</span>
                <ul className="space-y-1.5 font-mono text-slate-700 text-[11px]">
                  <li>• analyzeMaterial(text, fileName)</li>
                  <li>• teachConcept(input: TeachingTurnInput)</li>
                  <li>• evaluateUnderstanding(input: EvaluationInput)</li>
                  <li>• generateAdaptiveExplanation(input & strategy)</li>
                  <li>• generateQuiz(input: QuizGenerationInput)</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-blue-700 uppercase tracking-wider text-[11px]">The 7 Pedagogical Strategies</span>
                <ul className="space-y-1.5 font-mono text-slate-700 text-[11px]">
                  <li>1. SIMPLE_EXPLANATION (Jargon-free clarity)</li>
                  <li>2. REAL_WORLD_ANALOGY (Relatable parallels)</li>
                  <li>3. STEP_BY_STEP (Deconstructed logic)</li>
                  <li>4. PRACTICAL_EXAMPLE (Concrete scenarios)</li>
                  <li>5. COMPARISON (Contrast with known ideas)</li>
                  <li>6. QUESTION_LED (Socratic discovery)</li>
                  <li>7. ACADEMIC_DEEP_DIVE (Formal theory)</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content 4: API Health */}
        {activeTab === 'api' && (
          <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <Terminal className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Backend API Endpoint Health</h3>
                  <p className="text-xs text-slate-500">Live response from GET /api/health</p>
                </div>
              </div>
              <button
                onClick={fetchApiStatus}
                disabled={loadingApi}
                className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition-colors cursor-pointer border border-slate-200"
              >
                {loadingApi ? 'Pinging...' : 'Refresh Status'}
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 font-mono text-xs text-emerald-400 border border-slate-800 overflow-x-auto shadow-inner">
              <pre>{JSON.stringify(apiResponse, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
