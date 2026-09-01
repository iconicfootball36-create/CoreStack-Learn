import React, { useState, useEffect } from 'react';
import {
  Search,
  BookOpen,
  Brain,
  HelpCircle,
  Award,
  Upload,
  User,
  Sparkles,
  ArrowRight,
  Headphones,
  FileText,
  Sliders,
  X,
} from 'lucide-react';
import { StudyMaterial, TeachingStrategy } from '../types/database';

interface QuickCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  materials: StudyMaterial[];
  onNavigateTab: (tab: 'overview' | 'materials' | 'lecture' | 'diagnostics' | 'quiz' | 'matrix' | 'profile') => void;
  onStartLecture: (material: StudyMaterial, conceptName?: string) => void;
  onOpenUpload: () => void;
}

export const QuickCommandPalette: React.FC<QuickCommandPaletteProps> = ({
  isOpen,
  onClose,
  materials,
  onNavigateTab,
  onStartLecture,
  onOpenUpload,
}) => {
  const [query, setQuery] = useState('');

  // Handle global keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickNavActions = [
    {
      id: 'nav_lecture',
      title: 'Interactive Lecture Room (Dr. CoreStack)',
      subtitle: 'Jump into active grounded lecture dialogue',
      icon: Brain,
      category: 'Navigation',
      action: () => {
        onNavigateTab('lecture');
        onClose();
      },
    },
    {
      id: 'nav_quiz',
      title: 'Grounded Quiz Studio',
      subtitle: 'Take adaptive test verified against course materials',
      icon: HelpCircle,
      category: 'Navigation',
      action: () => {
        onNavigateTab('quiz');
        onClose();
      },
    },
    {
      id: 'nav_matrix',
      title: 'Mastery Knowledge Matrix',
      subtitle: 'View weak areas & cognitive learning velocity',
      icon: Award,
      category: 'Navigation',
      action: () => {
        onNavigateTab('matrix');
        onClose();
      },
    },
    {
      id: 'nav_diagnostics',
      title: 'Socratic Rubrics & Misconception Inspector',
      subtitle: 'Inspect 4-tier formative diagnostic assessments',
      icon: Sparkles,
      category: 'Navigation',
      action: () => {
        onNavigateTab('diagnostics');
        onClose();
      },
    },
    {
      id: 'nav_materials',
      title: 'Course Materials Library',
      subtitle: 'Manage uploaded PDFs, DOCX files, and course packs',
      icon: BookOpen,
      category: 'Navigation',
      action: () => {
        onNavigateTab('materials');
        onClose();
      },
    },
    {
      id: 'nav_upload',
      title: 'Upload New Study Material',
      subtitle: 'Ingest and chunk new syllabus or textbook chapter',
      icon: Upload,
      category: 'Action',
      action: () => {
        onOpenUpload();
        onClose();
      },
    },
  ];

  const filteredNavActions = quickNavActions.filter(
    (a) =>
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      a.subtitle.toLowerCase().includes(query.toLowerCase())
  );

  const filteredMaterials = materials.filter((m) =>
    m.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <Search className="w-5 h-5 text-blue-600 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands, topics, or study materials... (Esc to close)"
            className="flex-1 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none bg-transparent"
          />
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
            ESC
          </span>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="p-3 max-h-96 overflow-y-auto space-y-4">
          {/* Quick Actions */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 block">
              Quick Actions & Navigation
            </span>
            {filteredNavActions.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  className="w-full p-2.5 rounded-xl hover:bg-blue-50/70 transition-colors flex items-center justify-between text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-700 flex items-center justify-center transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 group-hover:text-blue-900 block">
                        {item.title}
                      </span>
                      <span className="text-[11px] text-slate-400 group-hover:text-blue-700/70">
                        {item.subtitle}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600" />
                </button>
              );
            })}
          </div>

          {/* Study Materials */}
          {filteredMaterials.length > 0 && (
            <div className="space-y-1 pt-2 border-t border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 block">
                Jump to Course Material Lecture
              </span>
              {filteredMaterials.map((mat) => (
                <button
                  key={mat.id}
                  onClick={() => {
                    onStartLecture(mat);
                    onClose();
                  }}
                  className="w-full p-2.5 rounded-xl hover:bg-blue-50/70 transition-colors flex items-center justify-between text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="truncate max-w-[340px]">
                      <span className="text-xs font-bold text-slate-800 group-hover:text-blue-900 block truncate">
                        {mat.title}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {mat.fileType?.toUpperCase() || 'FILE'} • {(mat.fileSize / 1024).toFixed(0)} KB
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-blue-600 group-hover:underline">
                    Teach →
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 px-4">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600 font-mono text-[10px]">
                ↑
              </kbd>{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600 font-mono text-[10px]">
                ↓
              </kbd>{' '}
              Navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600 font-mono text-[10px]">
                ↵
              </kbd>{' '}
              Select
            </span>
          </div>
          <span className="font-semibold text-blue-600">CoreStack Learn Command Hub</span>
        </div>
      </div>
    </div>
  );
};
