import React, { useState, useEffect } from 'react';
import {
  Brain,
  Sparkles,
  Award,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  ArrowRight,
  Play,
  HelpCircle,
  Layers,
  BookOpen,
  BarChart2,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { StudyMaterial, TeachingStrategy } from '../types/database';

interface ConceptMatrixItem {
  conceptName: string;
  materialId: string;
  materialTitle: string;
  level: 'NOT_UNDERSTOOD' | 'PARTIALLY_UNDERSTOOD' | 'UNDERSTOOD' | 'MASTERED';
  score: number;
  attemptsCount: number;
  isWeakArea: boolean;
  lastEvaluatedAt: string | null;
  recommendedStrategy: TeachingStrategy;
  summaryExcerpt: string;
}

interface MasteryMatrixData {
  totalConcepts: number;
  masteredCount: number;
  partiallyCount: number;
  weakCount: number;
  overallMasteryScore: number;
  concepts: ConceptMatrixItem[];
  recentQuizReports: any[];
}

interface MasteryKnowledgeMatrixProps {
  materials: StudyMaterial[];
  token: string | null;
  onNavigateToLecture: (material: StudyMaterial, conceptName: string, strategy?: TeachingStrategy) => void;
  onNavigateToQuiz: (material: StudyMaterial, conceptName: string) => void;
}

export const MasteryKnowledgeMatrix: React.FC<MasteryKnowledgeMatrixProps> = ({
  materials,
  token,
  onNavigateToLecture,
  onNavigateToQuiz,
}) => {
  const [matrixData, setMatrixData] = useState<MasteryMatrixData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'WEAK' | 'IN_PROGRESS' | 'MASTERED'>('ALL');
  const [selectedMaterialFilter, setSelectedMaterialFilter] = useState<string>('ALL');

  const fetchMatrix = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch('/api/mastery/matrix', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data: MasteryMatrixData = await res.json();
        setMatrixData(data);
      }
    } catch (err) {
      console.error('Failed to load mastery matrix:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatrix();
  }, [token]);

  const filteredConcepts = (matrixData?.concepts || []).filter((item) => {
    // Material filter
    if (selectedMaterialFilter !== 'ALL' && item.materialId !== selectedMaterialFilter) {
      return false;
    }

    // Status filter
    if (filterMode === 'WEAK' && !item.isWeakArea && item.level !== 'NOT_UNDERSTOOD') {
      return false;
    }
    if (filterMode === 'MASTERED' && item.level !== 'MASTERED') {
      return false;
    }
    if (
      filterMode === 'IN_PROGRESS' &&
      item.level !== 'UNDERSTOOD' &&
      item.level !== 'PARTIALLY_UNDERSTOOD'
    ) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.conceptName.toLowerCase().includes(q) ||
        item.materialTitle.toLowerCase().includes(q) ||
        item.summaryExcerpt.toLowerCase().includes(q)
      );
    }

    return true;
  });

  const getMaterialObj = (matId: string) => materials.find((m) => m.id === matId) || materials[0];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 mb-1">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>PHASE 11: MASTERY KNOWLEDGE MATRIX & WEAKNESS REMEDIATION</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Mastery Knowledge Matrix
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            Live cognitive map of your comprehension across all course topics. Pinpoint weak areas, track mastery velocity, and launch targeted 1-click re-teaching drills with Dr. CoreStack.
          </p>
        </div>

        <button
          onClick={fetchMatrix}
          className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 self-start md:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Matrix</span>
        </button>
      </div>

      {/* Analytics Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Overall Course Mastery
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-blue-600">
              {matrixData?.overallMasteryScore || 0}%
            </span>
            <span className="text-xs text-slate-500 font-medium">aggregate score</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 block">
            Mastered Concepts
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700">
              {matrixData?.masteredCount || 0}
            </span>
            <span className="text-xs text-slate-500 font-medium">of {matrixData?.totalConcepts || 0}</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 block">
            In Progress / Developing
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-700">
              {matrixData?.partiallyCount || 0}
            </span>
            <span className="text-xs text-slate-500 font-medium">learning active</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 block">
            Critical Weak Areas
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-rose-700">
              {matrixData?.weakCount || 0}
            </span>
            <span className="text-xs text-slate-500 font-medium">needs re-teaching</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search concepts, chapters, or keywords..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setFilterMode('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterMode === 'ALL'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Concepts ({matrixData?.totalConcepts || 0})
          </button>

          <button
            onClick={() => setFilterMode('WEAK')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              filterMode === 'WEAK'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Weak Areas ({matrixData?.weakCount || 0})</span>
          </button>

          <button
            onClick={() => setFilterMode('IN_PROGRESS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterMode === 'IN_PROGRESS'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            In Progress ({matrixData?.partiallyCount || 0})
          </button>

          <button
            onClick={() => setFilterMode('MASTERED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterMode === 'MASTERED'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            Mastered ({matrixData?.masteredCount || 0})
          </button>
        </div>
      </div>

      {/* Concept Matrix Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">
          <div className="w-6 h-6 border-2 border-blue-600/40 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
          <span>Analyzing conceptual mastery across all document chunks...</span>
        </div>
      ) : filteredConcepts.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center text-slate-500 text-xs space-y-2">
          <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="font-bold text-slate-700">No concepts matched your filter criteria.</p>
          <p className="text-slate-500">Try adjusting your search query or selecting "All Concepts".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredConcepts.map((item, idx) => {
            const material = getMaterialObj(item.materialId);
            const isMastered = item.level === 'MASTERED';
            const isWeak = item.isWeakArea || item.level === 'NOT_UNDERSTOOD';

            return (
              <div
                key={idx}
                className={`p-5 rounded-2xl bg-white border transition-all hover:shadow-md flex flex-col justify-between space-y-4 ${
                  isWeak
                    ? 'border-rose-200/80 hover:border-rose-300'
                    : isMastered
                    ? 'border-emerald-200/80 hover:border-emerald-300'
                    : 'border-slate-200 hover:border-blue-300'
                }`}
              >
                {/* Top Info */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate max-w-[170px]">
                      {item.materialTitle}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        isMastered
                          ? 'bg-emerald-100 text-emerald-800'
                          : isWeak
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.level.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug">
                    {item.conceptName}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {item.summaryExcerpt || 'Key conceptual framework and mechanics.'}
                  </p>
                </div>

                {/* Mastery Progress Bar */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Mastery Score</span>
                    <span
                      className={`font-extrabold ${
                        isMastered
                          ? 'text-emerald-600'
                          : isWeak
                          ? 'text-rose-600'
                          : 'text-amber-600'
                      }`}
                    >
                      {item.score}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isMastered
                          ? 'bg-emerald-500'
                          : isWeak
                          ? 'bg-rose-500'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.max(5, item.score)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <span>{item.attemptsCount} evaluations</span>
                    {item.lastEvaluatedAt && (
                      <span>{new Date(item.lastEvaluatedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => onNavigateToLecture(material, item.conceptName, item.recommendedStrategy)}
                    className="px-2.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-white" />
                    <span>Teach Me</span>
                  </button>

                  <button
                    onClick={() => onNavigateToQuiz(material, item.conceptName)}
                    className="px-2.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <HelpCircle className="w-3 h-3 text-blue-600" />
                    <span>Test Concept</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
