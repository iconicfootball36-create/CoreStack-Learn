import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Flame,
  Clock,
  Award,
  Sparkles,
  Upload,
  Plus,
  Trash2,
  Play,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  User,
  Settings,
  LogOut,
  Brain,
  Layers,
  BarChart3,
  Search,
  Filter,
  FileText,
  FileCode,
  ShieldCheck,
  Send,
  HelpCircle,
  RefreshCw,
  Sliders,
  ChevronRight,
  BookMarked
} from 'lucide-react';
import { useAuth } from '../lib/authContext';
import { StudyMaterial, MasteryProgress, AcademicLevel, LearningPace, TeachingStrategy, Topic, Concept } from '../types/database';
import { FormativeDiagnosticResult } from '../server/diagnosticEngine';
import { MaterialUploadModal } from './MaterialUploadModal';
import { MaterialDetailModal } from './MaterialDetailModal';
import { InteractiveLectureRoom } from './InteractiveLectureRoom';
import { FormativeDiagnosticInspector } from './FormativeDiagnosticInspector';
import { GroundedQuizStudio } from './GroundedQuizStudio';
import { MasteryKnowledgeMatrix } from './MasteryKnowledgeMatrix';
import { StudyPackExportModal } from './StudyPackExportModal';
import { QuickCommandPalette } from './QuickCommandPalette';

export const StudentDashboard: React.FC = () => {
  const { user, firebaseUser, token, isCloudSynced, logout, updateProfile, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'materials' | 'lecture' | 'diagnostics' | 'quiz' | 'matrix' | 'profile'>('overview');
  
  // Dashboard data state
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [diagnostics, setDiagnostics] = useState<FormativeDiagnosticResult[]>([]);
  const [selectedDiagnostic, setSelectedDiagnostic] = useState<FormativeDiagnosticResult | null>(null);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [stats, setStats] = useState({
    streakDays: user?.streakDays || 1,
    totalStudyMinutes: user?.totalStudyMinutes || 0,
    masteredConcepts: user?.masteredConceptsCount || 0,
    inProgressConcepts: user?.inProgressConceptsCount || 0,
    weakAreasCount: 0,
  });

  // Selected Material for Active Lecture
  const [selectedMaterial, setSelectedMaterial] = useState<StudyMaterial | null>(null);

  // Modals state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedDetailMaterialId, setSelectedDetailMaterialId] = useState<string | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [selectedExportMaterial, setSelectedExportMaterial] = useState<StudyMaterial | null>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Global Keyboard Shortcuts (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Profile Edit state
  const [editName, setEditName] = useState(user?.name || '');
  const [editAcademicLevel, setEditAcademicLevel] = useState<AcademicLevel>(user?.academicLevel || 'UNDERGRADUATE');
  const [editLearningPace, setEditLearningPace] = useState<LearningPace>(user?.learningPace || 'BALANCED');
  const [editStrategy, setEditStrategy] = useState<TeachingStrategy>(user?.preferredStrategy || 'REAL_WORLD_ANALOGY');
  const [editGoal, setEditGoal] = useState(user?.targetGoal || '');
  const [editSubject, setEditSubject] = useState(user?.focusSubject || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

  // Keep form fields synchronized with authenticated user state
  useEffect(() => {
    if (user) {
      setEditName(user.name || '');
      setEditAcademicLevel(user.academicLevel || 'UNDERGRADUATE');
      setEditLearningPace(user.learningPace || 'BALANCED');
      setEditStrategy(user.preferredStrategy || 'REAL_WORLD_ANALOGY');
      setEditGoal(user.targetGoal || '');
      setEditSubject(user.focusSubject || '');
      setStats(prev => ({
        ...prev,
        streakDays: user.streakDays ?? prev.streakDays,
        totalStudyMinutes: user.totalStudyMinutes ?? prev.totalStudyMinutes,
        masteredConcepts: user.masteredConceptsCount ?? prev.masteredConcepts,
        inProgressConcepts: user.inProgressConceptsCount ?? prev.inProgressConcepts,
      }));
    }
  }, [user]);

  // Live Interactive Lecture State
  const [lectureConcept, setLectureConcept] = useState('Virtual Memory & Demand Paging');

  // Start targeted lecture on specific concept or topic
  const handleStartTargetedLecture = (material: StudyMaterial, topic?: Topic, concept?: Concept) => {
    setSelectedMaterial(material);
    const targetTitle = concept?.title || topic?.title || material.title;
    setLectureConcept(targetTitle);
    setActiveTab('lecture');
  };

  const handleOpenDetailModal = (materialId: string) => {
    setSelectedDetailMaterialId(materialId);
    setDetailModalOpen(true);
  };

  // Fetch student materials & dashboard summary
  const fetchStudentData = async () => {
    if (!token) return;
    setLoadingMaterials(true);
    try {
      const [matRes, dashRes, diagRes] = await Promise.all([
        fetch('/api/student/materials', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/student/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/diagnostic/history', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (matRes.ok) {
        const data = await matRes.json();
        setMaterials(data.materials || []);
        if (data.materials?.length > 0 && !selectedMaterial) {
          setSelectedMaterial(data.materials[0]);
        }
      }

      if (dashRes.ok) {
        const dashData = await dashRes.json();
        if (dashData.stats) {
          setStats(dashData.stats);
        }
      }

      if (diagRes.ok) {
        const diagData = await diagRes.json();
        if (diagData.history) {
          setDiagnostics(diagData.history);
          if (diagData.history.length > 0 && !selectedDiagnostic) {
            setSelectedDiagnostic(diagData.history[diagData.history.length - 1]);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching student data:', err);
    } finally {
      setLoadingMaterials(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, [token]);

  // Handle Material Delete
  const handleDeleteMaterial = async (id: string) => {
    try {
      const res = await fetch(`/api/student/materials/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setMaterials(prev => prev.filter(m => m.id !== id));
        if (selectedMaterial?.id === id) {
          setSelectedMaterial(materials.find(m => m.id !== id) || null);
        }
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  // Handle Student Profile Update
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSaveSuccess(false);
    try {
      await updateProfile({
        name: editName,
        academicLevel: editAcademicLevel,
        learningPace: editLearningPace,
        preferredStrategy: editStrategy,
        targetGoal: editGoal,
        focusSubject: editSubject,
      });
      setProfileSaveSuccess(true);
      setTimeout(() => setProfileSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setProfileSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">
      {/* Top Header / App Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Product Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-slate-900">
                  CoreStack <span className="text-blue-600">Learn</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-[10px] font-mono font-bold uppercase">
                  Student Workspace
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium truncate max-w-[200px] sm:max-w-none">
                Logged in as <strong className="text-slate-800">{user?.name}</strong> ({user?.email})
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar & User Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Streak Counter */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-bold shadow-xs">
              <Flame className="w-4 h-4 text-amber-600 fill-amber-500" />
              <span>{stats.streakDays} Day Streak</span>
            </div>

            {/* Study Time */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{Math.floor(stats.totalStudyMinutes / 60)}h {stats.totalStudyMinutes % 60}m Studied</span>
            </div>

            {/* Quick Command Palette Button (Cmd+K) */}
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer border border-slate-200/80"
              title="Quick Search & Navigation (Ctrl+K / Cmd+K)"
            >
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Commands</span>
              <kbd className="hidden sm:inline px-1 py-0.5 rounded bg-white text-[10px] font-mono text-slate-500 border border-slate-200">
                ⌘K
              </kbd>
            </button>

            {/* Start Lecture Button */}
            <button
              onClick={() => setActiveTab('lecture')}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span className="hidden sm:inline">Launch Lecture</span>
            </button>

            {/* Sign Out */}
            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Workspace Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 overflow-x-auto border-t border-slate-100 py-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Mastery Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('materials')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'materials'
                ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>My Study Materials ({materials.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('lecture')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'lecture'
                ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Brain className="w-3.5 h-3.5 text-blue-600" />
            <span>Interactive Lecture Room</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </button>

          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'diagnostics'
                ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Socratic Rubrics ({diagnostics.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('quiz')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'quiz'
                ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
            <span>Grounded Quiz Studio</span>
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'matrix'
                ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-emerald-600" />
            <span>Mastery Matrix</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Student Profile & Account</span>
            {isCloudSynced && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Synced with Firebase Firestore" />
            )}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* ================= VIEW 1: OVERVIEW & MASTERY ================= */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-150">
            {/* Welcome Banner */}
            <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-800 text-white shadow-lg relative overflow-hidden">
              <div className="relative z-10 max-w-2xl space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-mono font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Personalized Pedagogical Engine Active</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Welcome back, {user?.name}.
                </h1>
                <p className="text-sm text-blue-100 leading-relaxed">
                  Focus Subject: <strong className="text-white">{user?.focusSubject || 'Computer Science & Operating Systems'}</strong>. Your AI lecturer is ready to break down complex concepts until every question is verified.
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setActiveTab('lecture')}
                    className="px-5 py-2.5 rounded-xl bg-white text-blue-900 font-bold text-xs hover:bg-blue-50 transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-blue-900" />
                    <span>Resume Active Lecture</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('quiz')}
                    className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs transition-colors border border-white/20 flex items-center gap-1.5 cursor-pointer"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-blue-200" />
                    <span>Take Grounded Quiz</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('matrix')}
                    className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs transition-colors border border-white/20 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Award className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Mastery Matrix</span>
                  </button>
                  <button
                    onClick={() => setUploadModalOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors border border-white/20 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Notes</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    Study Materials
                  </span>
                  <div className="text-2xl font-extrabold text-slate-900">{materials.length} Documents</div>
                  <span className="text-[11px] text-emerald-600 font-medium">100% Isolated & Grounded</span>
                </div>
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <Layers className="w-5 h-5" />
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    Mastered Concepts
                  </span>
                  <div className="text-2xl font-extrabold text-emerald-600">{stats.masteredConcepts}</div>
                  <span className="text-[11px] text-slate-500">Verified via cognitive checks</span>
                </div>
                <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    In Progress
                  </span>
                  <div className="text-2xl font-extrabold text-blue-600">{stats.inProgressConcepts}</div>
                  <span className="text-[11px] text-slate-500">Active learning loops</span>
                </div>
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    Flagged Weak Areas
                  </span>
                  <div className="text-2xl font-extrabold text-amber-600">{stats.weakAreasCount} Concept</div>
                  <span className="text-[11px] text-amber-700 font-medium">Re-teaching queued</span>
                </div>
                <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Weak Area Alert & Action Banner */}
            <div className="p-6 rounded-2xl bg-amber-50/70 border border-amber-200/90 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Misconception Detected: Thrashing & Working Set Model</span>
                  </div>
                  <p className="text-xs text-amber-900 leading-relaxed max-w-2xl">
                    During your last session, you confused excessive disk I/O paging with CPU cache misses. Dr. CoreStack has prepared a <strong>Real-World Analogy</strong> explanation to resolve this before your quiz.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setLectureConcept('Thrashing vs CPU Cache Misses');
                    setActiveTab('lecture');
                  }}
                  className="whitespace-nowrap px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Resolve Misconception Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Recent Uploaded Materials Preview */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-slate-900">Your Current Study Coursework</h2>
                <button
                  onClick={() => setActiveTab('materials')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>View All Documents</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {materials.map((m) => (
                  <div
                    key={m.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 transition-all flex flex-col justify-between group shadow-sm"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                          {m.fileType.toUpperCase()} • READY
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {(m.fileSize / (1024 * 1024)).toFixed(1)} MB
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {m.title}
                      </h3>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {m.summary}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedMaterial(m);
                            setActiveTab('lecture');
                          }}
                          className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-blue-600" />
                          <span>Start Lecture</span>
                        </button>
                        <span className="text-slate-300">•</span>
                        <button
                          onClick={() => handleOpenDetailModal(m.id)}
                          className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                        >
                          <Brain className="w-3 h-3 text-slate-500" />
                          <span>Inspect</span>
                        </button>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">Isolated</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= VIEW 2: MY STUDY MATERIALS (ISOLATED) ================= */}
        {activeTab === 'materials' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Header & Upload CTA */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">My Study Library</h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                  Private, isolated documents uploaded for your student account ({user?.email}).
                </p>
              </div>

              <button
                onClick={() => setUploadModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Upload New Course Material</span>
              </button>
            </div>

            {/* Materials Table / Card List */}
            {materials.length === 0 ? (
              <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center space-y-4 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <Upload className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">No Course Materials Yet</h3>
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                  Upload your lecture slides, textbook chapters, or handwritten notes to begin interactive AI-led sessions.
                </p>
                <button
                  onClick={() => setUploadModalOpen(true)}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-sm hover:bg-blue-700 cursor-pointer"
                >
                  Upload First Material
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {materials.map((m) => (
                  <div
                    key={m.id}
                    className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 border border-blue-100 font-mono text-xs font-bold uppercase">
                        {m.fileType}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-slate-900">{m.title}</h3>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-mono font-semibold">
                            READY FOR LECTURE
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-1">{m.summary}</p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono pt-1">
                          <span>File: {m.originalFileName}</span>
                          <span>•</span>
                          <span>Size: {(m.fileSize / 1024).toFixed(0)} KB</span>
                          <span>•</span>
                          <span>Added: {new Date(m.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center">
                      <button
                        onClick={() => {
                          setSelectedExportMaterial(m);
                          setExportModalOpen(true);
                        }}
                        className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                        title="Generate Academic Study Guide & Flashcard Pack"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        <span>Export Pack</span>
                      </button>

                      <button
                        onClick={() => handleOpenDetailModal(m.id)}
                        className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                        title="View Semantic Chunks & Course Curriculum"
                      >
                        <Brain className="w-3.5 h-3.5 text-slate-600" />
                        <span>Curriculum & Chunks</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelectedMaterial(m);
                          setActiveTab('lecture');
                        }}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Start Lecture</span>
                      </button>

                      <button
                        onClick={() => handleDeleteMaterial(m.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer"
                        title="Delete Material"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= VIEW 3: LIVE INTERACTIVE LECTURE ROOM ================= */}
        {activeTab === 'lecture' && (
          <InteractiveLectureRoom
            material={selectedMaterial || materials[0] || null}
            materials={materials}
            user={user}
            token={token}
            initialConcept={lectureConcept}
            onSelectMaterial={(m) => setSelectedMaterial(m)}
            onOpenInspectModal={(materialId) => handleOpenDetailModal(materialId)}
          />
        )}

        {/* ================= VIEW 4: SOCRATIC RUBRICS & FORMATIVE DIAGNOSTICS ================= */}
        {activeTab === 'diagnostics' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                    Diagnostic Engine
                  </span>
                  <span className="text-xs text-slate-500 font-medium">4-Tier Cognitive Rubric</span>
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                  Socratic Understanding Evaluations & Misconceptions
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Grounded assessments of your explanations across 5 Bloom cognitive dimensions with contrastive error corrections.
                </p>
              </div>

              <button
                onClick={() => setActiveTab('lecture')}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Launch Lecture Check</span>
              </button>
            </div>

            {diagnostics.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-100">
                  <Sparkles className="w-7 h-7" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h3 className="font-extrabold text-slate-900 text-base">No Socratic Diagnostics Recorded Yet</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Start an interactive lecture session with Dr. CoreStack and click <strong>"🎯 Socratic Check"</strong> on any concept to test your understanding.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('lecture')}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-sm cursor-pointer inline-flex items-center gap-2"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Start Lecture & Run Check</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Diagnostic History List (5 Cols) */}
                <div className="lg:col-span-5 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-600 px-1">
                    <span>Evaluation Records ({diagnostics.length})</span>
                    <span>Most Recent</span>
                  </div>

                  <div className="space-y-2.5 max-h-[600px] overflow-y-auto">
                    {diagnostics.map((diag, index) => {
                      const isSelected = selectedDiagnostic?.id === diag.id;
                      return (
                        <div
                          key={diag.id || index}
                          onClick={() => setSelectedDiagnostic(diag)}
                          className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
                            isSelected
                              ? 'bg-blue-50/70 border-blue-300 shadow-sm'
                              : 'bg-white hover:bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                                diag.level === 'MASTERED'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : diag.level === 'UNDERSTOOD'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : diag.level === 'PARTIALLY_UNDERSTOOD'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              {diag.level.replace(/_/g, ' ')}
                            </span>
                            <span className="text-xs font-extrabold text-slate-800 font-mono">
                              {diag.score}%
                            </span>
                          </div>

                          <div>
                            <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                              {diag.conceptName}
                            </h4>
                            <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                              {diag.studentAnswer}
                            </p>
                          </div>

                          {diag.misconceptions && diag.misconceptions.length > 0 && (
                            <div className="flex items-center gap-1.5 text-[10px] text-rose-700 font-semibold bg-rose-50 px-2 py-1 rounded">
                              <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                              <span className="line-clamp-1">{diag.misconceptions[0]}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Diagnostic Inspector Card (7 Cols) */}
                <div className="lg:col-span-7">
                  {selectedDiagnostic ? (
                    <FormativeDiagnosticInspector
                      diagnostic={selectedDiagnostic}
                      onApplyStrategy={(strategy, actionPrompt) => {
                        setLectureConcept(selectedDiagnostic.conceptName);
                        setActiveTab('lecture');
                      }}
                    />
                  ) : (
                    <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 text-slate-500 text-xs">
                      Select a diagnostic evaluation from the left to inspect detailed Bloom taxonomy scores and misconception fixes.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= VIEW 5: GROUNDED QUIZ STUDIO ================= */}
        {activeTab === 'quiz' && (
          <GroundedQuizStudio
            materials={materials}
            token={token}
            onNavigateToLecture={(mat, concept, strategy) => {
              setSelectedMaterial(mat);
              setLectureConcept(concept);
              setActiveTab('lecture');
            }}
          />
        )}

        {/* ================= VIEW 6: MASTERY KNOWLEDGE MATRIX ================= */}
        {activeTab === 'matrix' && (
          <MasteryKnowledgeMatrix
            materials={materials}
            token={token}
            onNavigateToLecture={(mat, concept, strategy) => {
              setSelectedMaterial(mat);
              setLectureConcept(concept);
              setActiveTab('lecture');
            }}
            onNavigateToQuiz={(mat, concept) => {
              setSelectedMaterial(mat);
              setLectureConcept(concept);
              setActiveTab('quiz');
            }}
          />
        )}

        {/* ================= VIEW 7: STUDENT PROFILE & CLOUD ACCOUNT ================= */}
        {activeTab === 'profile' && (
          <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-150">
            {/* Cloud Persistence & Account Identity Card */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{user?.name || 'Student Scholar'}</h2>
                    <p className="text-xs text-slate-500 font-mono">{user?.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Firebase Connected</span>
                  </span>
                  <button
                    onClick={logout}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>

              {/* Account Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 text-[11px] block font-medium">Account ID / UID</span>
                  <span className="font-mono text-slate-800 truncate block mt-0.5" title={user?.id}>
                    {user?.id ? `${user.id.slice(0, 16)}...` : 'Active Session'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 text-[11px] block font-medium">Cloud Database</span>
                  <span className="font-semibold text-slate-800 block mt-0.5">Firestore (Applet Live)</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500 text-[11px] block font-medium">Authentication</span>
                  <span className="font-semibold text-slate-800 block mt-0.5">
                    {firebaseUser ? 'Firebase Auth' : 'Verified Student'}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile Preferences Form */}
            <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">Pedagogical & Learning Preferences</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Dr. CoreStack personalizes explanations according to your academic level, cognitive pace, and target goals.
                </p>
              </div>

              {profileSaveSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Preferences saved successfully and synced to your cloud profile.</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Full Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Email Address (Registered Account)</label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-sm cursor-not-allowed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Academic Level</label>
                    <select
                      value={editAcademicLevel}
                      onChange={(e) => setEditAcademicLevel(e.target.value as AcademicLevel)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-blue-600 font-medium"
                    >
                      <option value="HIGH_SCHOOL">High School</option>
                      <option value="UNDERGRADUATE">Undergraduate</option>
                      <option value="GRADUATE">Graduate / Master's</option>
                      <option value="PROFESSIONAL">Professional / Post-grad</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Cognitive Learning Pace</label>
                    <select
                      value={editLearningPace}
                      onChange={(e) => setEditLearningPace(e.target.value as LearningPace)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-blue-600 font-medium"
                    >
                      <option value="BALANCED">Balanced Pace (Recommended)</option>
                      <option value="FAST">Fast & Concentrated</option>
                      <option value="DEEP_DIVE">Deep Rigorous Dive</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Preferred Default Re-Teaching Style</label>
                  <select
                    value={editStrategy}
                    onChange={(e) => setEditStrategy(e.target.value as TeachingStrategy)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-blue-600 font-medium"
                  >
                    <option value="REAL_WORLD_ANALOGY">Real-World Analogy (Relatable parallels)</option>
                    <option value="SIMPLE_EXPLANATION">Simple Explanation (Jargon-free clarity)</option>
                    <option value="STEP_BY_STEP">Step-by-Step Logic (Deconstructed mechanics)</option>
                    <option value="QUESTION_LED">Socratic Questioning (Self-guided discovery)</option>
                    <option value="PRACTICAL_EXAMPLE">Practical Code / Numerical Examples</option>
                    <option value="ACADEMIC_DEEP_DIVE">Academic Deep Dive (Formal theory)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Primary Focus Subject</label>
                  <input
                    type="text"
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    placeholder="e.g. Computer Science, Operating Systems, Econometrics"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Target Academic Goal</label>
                  <textarea
                    rows={2}
                    value={editGoal}
                    onChange={(e) => setEditGoal(e.target.value)}
                    placeholder="e.g. Master Distributed Systems for upcoming midterm"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <span>{profileSaving ? 'Saving to Cloud...' : 'Save Preferences'}</span>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Material Ingestion Modal */}
      <MaterialUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        token={token}
        onMaterialUploaded={(newMat) => {
          fetchStudentData();
          setSelectedMaterial(newMat);
          handleOpenDetailModal(newMat.id);
        }}
      />

      {/* Material Curriculum & Chunks Inspector Modal */}
      <MaterialDetailModal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedDetailMaterialId(null);
        }}
        materialId={selectedDetailMaterialId}
        token={token}
        onStartLecture={(mat, topic, concept) => {
          handleStartTargetedLecture(mat, topic, concept);
        }}
      />

      {/* Academic Study Pack & Revision Guide Modal */}
      {selectedExportMaterial && exportModalOpen && (
        <StudyPackExportModal
          material={selectedExportMaterial}
          token={token}
          onClose={() => {
            setExportModalOpen(false);
            setSelectedExportMaterial(null);
          }}
        />
      )}

      {/* Global Quick Command Palette (Cmd+K / Ctrl+K) */}
      <QuickCommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        materials={materials}
        onNavigateTab={(tab) => setActiveTab(tab)}
        onStartLecture={(mat, conceptName) => {
          setSelectedMaterial(mat);
          if (conceptName) setLectureConcept(conceptName);
          setActiveTab('lecture');
        }}
        onOpenUpload={() => setUploadModalOpen(true)}
      />
    </div>
  );
};
