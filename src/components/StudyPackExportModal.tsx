import React, { useState, useEffect } from 'react';
import Markdown from 'react-markdown';
import {
  X,
  Sparkles,
  Download,
  Copy,
  Printer,
  FileText,
  Layers,
  BookOpen,
  CheckCircle2,
  Brain,
  RotateCw,
  Sliders,
  Award,
} from 'lucide-react';
import { StudyMaterial } from '../types/database';
import { GeneratedStudyBriefing } from '../server/exportEngine';

interface StudyPackExportModalProps {
  material: StudyMaterial;
  token: string | null;
  onClose: () => void;
}

export const StudyPackExportModal: React.FC<StudyPackExportModalProps> = ({
  material,
  token,
  onClose,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<
    'FULL_STUDY_GUIDE' | 'EXAM_CHEAT_SHEET' | 'ANKI_FLASHCARDS' | 'SOCRATIC_RECAP'
  >('FULL_STUDY_GUIDE');
  
  const [isGenerating, setIsGenerating] = useState<boolean>(true);
  const [briefing, setBriefing] = useState<GeneratedStudyBriefing | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'document' | 'flashcards'>('document');
  const [flippedCardIndex, setFlippedCardIndex] = useState<number | null>(null);

  const fetchBriefing = async (format = selectedFormat) => {
    if (!token || !material) return;
    try {
      setIsGenerating(true);
      const res = await fetch('/api/export/study-guide', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          materialId: material.id,
          format,
        }),
      });

      if (res.ok) {
        const data: GeneratedStudyBriefing = await res.json();
        setBriefing(data);
      }
    } catch (err) {
      console.error('Failed to generate academic briefing:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    fetchBriefing(selectedFormat);
  }, [material.id, selectedFormat]);

  const handleCopyMarkdown = () => {
    if (!briefing?.markdownContent) return;
    navigator.clipboard.writeText(briefing.markdownContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    if (!briefing?.markdownContent) return;
    const blob = new Blob([briefing.markdownContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `${material.title.replace(/[^a-zA-Z0-9]/g, '_')}_Study_Guide.md`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60">
                  Academic Export & Revision Pack
                </span>
                <span className="text-xs text-slate-400 font-medium truncate max-w-[200px]">
                  {material.title}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight">
                Study Guide & High-Yield Briefing
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-slate-200/70 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Format Selector Bar & Action Controls */}
        <div className="px-6 py-3 border-b border-slate-100 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => {
                setSelectedFormat('FULL_STUDY_GUIDE');
                setActiveTab('document');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedFormat === 'FULL_STUDY_GUIDE' && activeTab === 'document'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Comprehensive Guide
            </button>

            <button
              onClick={() => {
                setSelectedFormat('EXAM_CHEAT_SHEET');
                setActiveTab('document');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedFormat === 'EXAM_CHEAT_SHEET' && activeTab === 'document'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Exam Cheat Sheet
            </button>

            <button
              onClick={() => setActiveTab('flashcards')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'flashcards'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Active Flashcards ({briefing?.flashcardDeck?.length || 0})</span>
            </button>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handleCopyMarkdown}
              disabled={isGenerating || !briefing}
              className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Markdown</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadMarkdown}
              disabled={isGenerating || !briefing}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .MD</span>
            </button>

            <button
              onClick={handlePrint}
              disabled={isGenerating || !briefing}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
              title="Print study briefing"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-slate-50/30">
          {isGenerating ? (
            <div className="py-20 text-center text-slate-500 space-y-3">
              <div className="w-8 h-8 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800">
                  Dr. CoreStack is synthesizing your academic revision pack...
                </p>
                <p className="text-xs text-slate-400">
                  Extracting formulas, invariants, and high-yield flashcard drills.
                </p>
              </div>
            </div>
          ) : activeTab === 'flashcards' ? (
            /* Interactive Flashcard Drills */
            <div className="space-y-6">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-slate-700">
                  Interactive Active Recall Drills (Click card to flip)
                </span>
                <span>{briefing?.flashcardDeck?.length || 0} cards generated</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(briefing?.flashcardDeck || []).map((card, idx) => {
                  const isFlipped = flippedCardIndex === idx;
                  return (
                    <div
                      key={idx}
                      onClick={() => setFlippedCardIndex(isFlipped ? null : idx)}
                      className={`min-h-[160px] p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between select-none shadow-xs ${
                        isFlipped
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                          : 'bg-white hover:bg-blue-50/40 border-slate-200 text-slate-900'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {isFlipped ? 'Answer & Invariant' : `Card #${idx + 1}`}
                          </span>
                          <span className="text-[10px] font-semibold text-blue-600">
                            {card.category}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm font-bold leading-relaxed">
                          {isFlipped ? card.back : card.front}
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-slate-100/80">
                        <span className="flex items-center gap-1 text-[10px]">
                          <RotateCw className="w-3 h-3" />
                          <span>{isFlipped ? 'Click to show question' : 'Click to flip answer'}</span>
                        </span>
                        <span className="font-bold">{isFlipped ? '✓ Mastered' : 'Reveal'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Document View */
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm max-w-3xl mx-auto space-y-6 text-slate-800">
              <div className="markdown-body text-xs sm:text-sm leading-relaxed space-y-4">
                <Markdown>{briefing?.markdownContent || ''}</Markdown>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
