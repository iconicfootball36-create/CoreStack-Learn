import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  RotateCcw,
  ArrowRight,
  BookOpen,
  Target,
  Award,
  Layers,
  Clock,
  ChevronRight,
  FileText,
  Brain,
  Sliders,
  Check,
} from 'lucide-react';
import { StudyMaterial, TeachingStrategy } from '../types/database';
import { GroundedQuiz, GeneratedQuizQuestion, QuizEvaluationReport } from '../server/quizEngine';

interface GroundedQuizStudioProps {
  materials: StudyMaterial[];
  token: string | null;
  onNavigateToLecture: (material: StudyMaterial, conceptName: string, strategy?: TeachingStrategy) => void;
}

export const GroundedQuizStudio: React.FC<GroundedQuizStudioProps> = ({
  materials,
  token,
  onNavigateToLecture,
}) => {
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(
    materials.length > 0 ? materials[0].id : ''
  );
  const [targetConcept, setTargetConcept] = useState<string>('');
  const [questionCount, setQuestionCount] = useState<number>(4);
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD' | 'ADAPTIVE'>('ADAPTIVE');
  
  // Quiz active state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [activeQuiz, setActiveQuiz] = useState<GroundedQuiz | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [evaluationReport, setEvaluationReport] = useState<QuizEvaluationReport | null>(null);
  const [pastReports, setPastReports] = useState<QuizEvaluationReport[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);

  // Sync selected material if materials change
  useEffect(() => {
    if (materials.length > 0 && !selectedMaterialId) {
      setSelectedMaterialId(materials[0].id);
    }
  }, [materials, selectedMaterialId]);

  // Fetch past quiz reports
  const fetchPastReports = async () => {
    if (!token) return;
    try {
      setLoadingHistory(true);
      const res = await fetch('/api/quiz/history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPastReports(data.reports || []);
      }
    } catch (err) {
      console.warn('Failed to load past quiz history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchPastReports();
  }, [token]);

  // Generate a new Grounded Quiz
  const handleGenerateQuiz = async () => {
    if (!selectedMaterialId || !token) return;
    try {
      setIsGenerating(true);
      setEvaluationReport(null);
      setAnswers({});
      setActiveQuestionIndex(0);

      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          materialId: selectedMaterialId,
          conceptName: targetConcept.trim() || undefined,
          questionCount,
          difficulty,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate grounded quiz');
      }

      const quizData: GroundedQuiz = await res.json();
      setActiveQuiz(quizData);
    } catch (err) {
      console.error('Quiz generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Submit Quiz Answers for Evaluation
  const handleSubmitQuiz = async () => {
    if (!activeQuiz || !token) return;
    try {
      setIsSubmitting(true);
      const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer,
      }));

      // Ensure all questions are represented even if unanswered
      for (const q of activeQuiz.questions) {
        if (!answers[q.id]) {
          formattedAnswers.push({ questionId: q.id, answer: 'No answer provided' });
        }
      }

      const res = await fetch('/api/quiz/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          quiz: activeQuiz,
          studentAnswers: formattedAnswers,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to evaluate quiz submission');
      }

      const report: QuizEvaluationReport = await res.json();
      setEvaluationReport(report);
      fetchPastReports();
    } catch (err) {
      console.error('Quiz evaluation error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const currentMaterial = materials.find((m) => m.id === selectedMaterialId);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 mb-1">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>GROUNDED ASSESSMENT & KNOWLEDGE VERIFICATION</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Grounded Quiz Studio
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            Test and verify your genuine comprehension with adaptive questions generated strictly from your uploaded course materials. Uncover blindspots and trigger instant AI re-teaching.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
              Tests Completed
            </span>
            <span className="text-base font-extrabold text-slate-800">
              {pastReports.length}
            </span>
          </div>
          <div className="px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 block">
              Avg Mastery
            </span>
            <span className="text-base font-extrabold text-emerald-800">
              {pastReports.length > 0
                ? `${Math.round(
                    pastReports.reduce((acc, r) => acc + r.overallScore, 0) / pastReports.length
                  )}%`
                : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Quiz Configuration & Generator */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              <span>Configure Assessment</span>
            </h3>

            {/* Select Material */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Target Study Material
              </label>
              <select
                value={selectedMaterialId}
                onChange={(e) => setSelectedMaterialId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Specific Concept (Optional) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Specific Topic Focus (Optional)
              </label>
              <input
                type="text"
                value={targetConcept}
                onChange={(e) => setTargetConcept(e.target.value)}
                placeholder="e.g., Page Faults or Memory Paging"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <p className="text-[11px] text-slate-400">
                Leave blank to generate a mixed comprehensive test covering all sections.
              </p>
            </div>

            {/* Question Count & Difficulty */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">Questions</label>
                <select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value={3}>3 Questions (Quick)</option>
                  <option value={4}>4 Questions (Standard)</option>
                  <option value={6}>6 Questions (Deep)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="ADAPTIVE">Adaptive Rigor</option>
                  <option value="EASY">Foundational</option>
                  <option value="MEDIUM">Standard</option>
                  <option value="HARD">Exam-Grade (Hard)</option>
                </select>
              </div>
            </div>

            {/* Launch Button */}
            <button
              onClick={handleGenerateQuiz}
              disabled={isGenerating || materials.length === 0}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Synthesizing Grounded Questions...</span>
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4" />
                  <span>Generate Grounded Quiz</span>
                </>
              )}
            </button>
          </div>

          {/* Past Quiz Attempts Summary */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
              <span>Recent Test Reports</span>
              <span className="text-xs text-slate-400 font-normal">{pastReports.length} stored</span>
            </h3>

            {pastReports.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs">
                No quizzes taken yet. Generate a test to assess your retention!
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {pastReports.slice(0, 5).map((rep) => (
                  <div
                    key={rep.id}
                    onClick={() => setEvaluationReport(rep)}
                    className="p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 transition-all cursor-pointer space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 truncate max-w-[150px]">
                        {rep.materialTitle}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          rep.overallScore >= 80
                            ? 'bg-emerald-100 text-emerald-800'
                            : rep.overallScore >= 60
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {rep.overallScore}% Score
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{rep.correctCount}/{rep.totalQuestions} correct</span>
                      <span>{new Date(rep.completedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Columns: Active Quiz Stage OR Evaluation Report */}
        <div className="lg:col-span-2 space-y-6">
          {/* STATE 1: Evaluation Report View */}
          {evaluationReport ? (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Score & Verdict Card */}
              <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 block">
                      Diagnostic Evaluation Complete
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
                      {evaluationReport.materialTitle}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[11px] text-slate-500 block">Mastery Score</span>
                      <span
                        className={`text-2xl font-black ${
                          evaluationReport.overallScore >= 80
                            ? 'text-emerald-600'
                            : evaluationReport.overallScore >= 60
                            ? 'text-amber-600'
                            : 'text-rose-600'
                        }`}
                      >
                        {evaluationReport.overallScore}%
                      </span>
                    </div>
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-extrabold text-lg shadow-sm ${
                        evaluationReport.overallScore >= 80
                          ? 'bg-emerald-500'
                          : evaluationReport.overallScore >= 60
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                    >
                      {evaluationReport.overallScore >= 80 ? (
                        <CheckCircle2 className="w-6 h-6" />
                      ) : evaluationReport.overallScore >= 60 ? (
                        <AlertTriangle className="w-6 h-6" />
                      ) : (
                        <XCircle className="w-6 h-6" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Remediation Action Callout (Pedagogical Handshake to Lecture Room) */}
                {evaluationReport.prescribedRemediationConcept && currentMaterial && (
                  <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Brain className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        <span className="text-xs font-extrabold text-blue-900">
                          Prescribed AI Re-Teaching: "{evaluationReport.prescribedRemediationConcept}"
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                        Strategy: {evaluationReport.prescribedStrategy || 'REAL_WORLD_ANALOGY'}
                      </span>
                    </div>

                    <p className="text-xs text-blue-800 leading-relaxed">
                      {evaluationReport.recommendedNextAction}
                    </p>

                    <button
                      onClick={() =>
                        onNavigateToLecture(
                          currentMaterial,
                          evaluationReport.prescribedRemediationConcept!,
                          evaluationReport.prescribedStrategy
                        )
                      }
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-sm inline-flex items-center gap-2 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Launch Targeted Remediation with Dr. CoreStack</span>
                    </button>
                  </div>
                )}

                {/* Concept-by-Concept Performance Breakdown */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Tested Concept Breakdown
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {evaluationReport.conceptBreakdown.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between"
                      >
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">
                            {item.conceptName}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {item.status.replace('_', ' ')}
                          </span>
                        </div>
                        <span
                          className={`text-xs font-extrabold px-2.5 py-1 rounded-lg ${
                            item.score >= 80
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.score >= 60
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {item.score}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Detailed Questions & Grounded Source Excerpt Review */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Question-by-Question Diagnostic Review
                  </h4>

                  <div className="space-y-4">
                    {evaluationReport.questionResults.map((q, idx) => (
                      <div
                        key={q.questionId}
                        className={`p-4 rounded-xl border space-y-3 ${
                          q.isCorrect
                            ? 'bg-emerald-50/40 border-emerald-200'
                            : 'bg-rose-50/40 border-rose-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span className="text-xs font-bold text-slate-800">
                            {idx + 1}. {q.prompt}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              q.isCorrect
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {q.isCorrect ? 'Correct (+100)' : 'Incorrect'}
                          </span>
                        </div>

                        <div className="text-xs text-slate-700 space-y-1">
                          <p>
                            <span className="font-semibold text-slate-500">Your Answer:</span>{' '}
                            <span className={q.isCorrect ? 'text-emerald-800 font-medium' : 'text-rose-800 font-medium'}>
                              {q.studentAnswer || 'None'}
                            </span>
                          </p>
                          {!q.isCorrect && (
                            <p>
                              <span className="font-semibold text-slate-500">Correct Answer:</span>{' '}
                              <span className="text-emerald-800 font-medium">{q.correctAnswer}</span>
                            </p>
                          )}
                          <p className="text-slate-600 mt-1">{q.feedback}</p>
                        </div>

                        {/* Grounding Source Citation */}
                        <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-[11px] text-slate-600 space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-slate-700">
                            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                            <span>Grounded in Section: {q.groundingHeading}</span>
                          </div>
                          <p className="italic text-slate-500">"{q.groundingExcerpt}"</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Retake Button */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => setEvaluationReport(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Take Another Test</span>
                  </button>
                </div>
              </div>
            </div>
          ) : activeQuiz ? (
            /* STATE 2: Active Test Taking Stage */
            <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6 animate-in fade-in duration-200">
              {/* Test Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 block">
                    Active Grounded Assessment
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {activeQuiz.materialTitle}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">
                    Question {activeQuestionIndex + 1} of {activeQuiz.questions.length}
                  </span>
                  <div className="flex gap-1">
                    {activeQuiz.questions.map((q, idx) => (
                      <button
                        key={q.id}
                        onClick={() => setActiveQuestionIndex(idx)}
                        className={`w-6 h-6 rounded-md text-[11px] font-bold flex items-center justify-center transition-all cursor-pointer ${
                          idx === activeQuestionIndex
                            ? 'bg-blue-600 text-white'
                            : answers[q.id]
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Current Question Display */}
              {activeQuiz.questions[activeQuestionIndex] && (
                <div className="space-y-6">
                  {(() => {
                    const currentQ = activeQuiz.questions[activeQuestionIndex];
                    return (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            {currentQ.conceptName}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {currentQ.type.replace(/_/g, ' ')}
                          </span>
                        </div>

                        <h4 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                          {currentQ.prompt}
                        </h4>

                        {/* Question Interaction Options */}
                        {currentQ.options && currentQ.options.length > 0 ? (
                          <div className="space-y-2.5 pt-2">
                            {currentQ.options.map((opt, idx) => {
                              const isSelected = answers[currentQ.id] === opt;
                              return (
                                <button
                                  key={idx}
                                  onClick={() => handleSelectAnswer(currentQ.id, opt)}
                                  className={`w-full p-3.5 rounded-xl border text-left text-xs font-medium transition-all flex items-center justify-between cursor-pointer ${
                                    isSelected
                                      ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-sm'
                                      : 'bg-slate-50/50 hover:bg-slate-50 border-slate-200 text-slate-800'
                                  }`}
                                >
                                  <span className="flex items-center gap-3">
                                    <span
                                      className={`w-5 h-5 rounded-full border text-[10px] font-bold flex items-center justify-center ${
                                        isSelected
                                          ? 'border-blue-600 bg-blue-600 text-white'
                                          : 'border-slate-300 text-slate-500'
                                      }`}
                                    >
                                      {String.fromCharCode(65 + idx)}
                                    </span>
                                    <span>{opt}</span>
                                  </span>
                                  {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          /* Free Text / Socratic Explanation Box */
                          <div className="space-y-2 pt-2">
                            <label className="text-xs font-semibold text-slate-700 block">
                              Write your conceptual explanation in your own words:
                            </label>
                            <textarea
                              rows={4}
                              value={answers[currentQ.id] || ''}
                              onChange={(e) => handleSelectAnswer(currentQ.id, e.target.value)}
                              placeholder="Explain the mechanism, causal flow, or algorithmic rules..."
                              className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Navigation Controls */}
                  <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                    <button
                      onClick={() => setActiveQuestionIndex((prev) => Math.max(0, prev - 1))}
                      disabled={activeQuestionIndex === 0}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-30 cursor-pointer"
                    >
                      Previous
                    </button>

                    <div className="flex items-center gap-3">
                      {activeQuestionIndex < activeQuiz.questions.length - 1 ? (
                        <button
                          onClick={() => setActiveQuestionIndex((prev) => prev + 1)}
                          className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
                        >
                          <span>Next Question</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={handleSubmitQuiz}
                          disabled={isSubmitting}
                          className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {isSubmitting ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                              <span>Evaluating Grounded Submission...</span>
                            </>
                          ) : (
                            <>
                              <Award className="w-4 h-4" />
                              <span>Submit Assessment for Grading</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* STATE 3: Ready to Begin Placeholder */
            <div className="p-12 rounded-2xl bg-white border border-slate-200 shadow-sm text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <HelpCircle className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  Ready to test your academic retention?
                </h3>
                <p className="text-xs text-slate-600">
                  Select a study material on the left and click <strong>Generate Grounded Quiz</strong>. Our AI assessor will extract core propositions and build questions verified against your textbook notes.
                </p>
              </div>
              <button
                onClick={handleGenerateQuiz}
                disabled={isGenerating || materials.length === 0}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-sm inline-flex items-center gap-2 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Start Practice Quiz Now</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
