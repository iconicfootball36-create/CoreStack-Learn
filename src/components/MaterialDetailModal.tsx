import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Layers,
  Brain,
  Play,
  X,
  FileText,
  Clock,
  Sparkles,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Hash,
  Database,
  Download
} from 'lucide-react';
import { StudyMaterial, DocumentChunk, Course, Topic, Concept } from '../types/database';
import { StudyPackExportModal } from './StudyPackExportModal';

interface MaterialDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  materialId: string | null;
  token: string | null;
  onStartLecture: (material: StudyMaterial, topic?: Topic, concept?: Concept) => void;
}

export const MaterialDetailModal: React.FC<MaterialDetailModalProps> = ({
  isOpen,
  onClose,
  materialId,
  token,
  onStartLecture,
}) => {
  const [activeTab, setActiveTab] = useState<'curriculum' | 'chunks' | 'rawText'>('curriculum');
  const [loading, setLoading] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [details, setDetails] = useState<{
    material: StudyMaterial;
    chunks: DocumentChunk[];
    course: Course;
    topics: Topic[];
    concepts: Concept[];
  } | null>(null);

  const [expandedTopicIds, setExpandedTopicIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen && materialId && token) {
      fetchMaterialDetails();
    }
  }, [isOpen, materialId, token]);

  const fetchMaterialDetails = async () => {
    if (!materialId || !token) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/student/materials/${materialId}/details`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDetails(data);
        // Expand all topics by default
        const initialExpanded: Record<string, boolean> = {};
        (data.topics || []).forEach((t: Topic) => {
          initialExpanded[t.id] = true;
        });
        setExpandedTopicIds(initialExpanded);
      }
    } catch (err) {
      console.error('Failed to fetch material details:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleTopicExpand = (topicId: string) => {
    setExpandedTopicIds((prev) => ({ ...prev, [topicId]: !prev[topicId] }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-xs uppercase">
              {details?.material.fileType || 'DOC'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-mono font-bold uppercase">
                  READY • {details?.chunks?.length || 0} SEMANTIC CHUNKS
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {details?.material.originalFileName}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1">
                {details?.material.title || 'Course Material Details'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {details?.material && (
              <>
                <button
                  onClick={() => setShowExportModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Generate Markdown Study Guide & Flashcard Deck"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>Export Study Pack</span>
                </button>

                <button
                  onClick={() => {
                    onStartLecture(details.material);
                    onClose();
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Launch Lecture</span>
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 border-b border-slate-100 flex items-center gap-4">
          <button
            onClick={() => setActiveTab('curriculum')}
            className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'curriculum'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Curriculum & Concept Graph ({details?.concepts?.length || 0} Concepts)</span>
          </button>

          <button
            onClick={() => setActiveTab('chunks')}
            className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'chunks'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Semantic Chunks ({details?.chunks?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('rawText')}
            className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'rawText'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Cleaned Source Text</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-mono text-slate-500">Loading document intelligence & semantic chunks...</p>
            </div>
          ) : !details ? (
            <div className="py-12 text-center text-xs text-slate-500">Document data unavailable.</div>
          ) : (
            <>
              {/* TAB 1: CURRICULUM TREE & CONCEPTS */}
              {activeTab === 'curriculum' && (
                <div className="space-y-6">
                  {/* Course Summary Banner */}
                  <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 space-y-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-700">
                      Curriculum Plan Overview
                    </span>
                    <p className="text-xs text-blue-900 leading-relaxed">
                      {details.course.description || details.material.summary}
                    </p>
                  </div>

                  {/* Topics List */}
                  <div className="space-y-4">
                    {details.topics.map((topic, tIdx) => {
                      const isExpanded = expandedTopicIds[topic.id] ?? true;
                      return (
                        <div
                          key={topic.id}
                          className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs"
                        >
                          {/* Topic Header Accordion */}
                          <div
                            onClick={() => toggleTopicExpand(topic.id)}
                            className="p-4 bg-slate-50/70 hover:bg-slate-100/70 flex items-center justify-between cursor-pointer transition-colors border-b border-slate-100"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold font-mono">
                                {tIdx + 1}
                              </div>
                              <div>
                                <h3 className="font-bold text-sm text-slate-900">{topic.title}</h3>
                                <p className="text-[11px] text-slate-500">
                                  {topic.concepts?.length || 0} Atomic Concepts • ~{topic.estimatedMinutes || 20} min study
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onStartLecture(details.material, topic);
                                  onClose();
                                }}
                                className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <Play className="w-3 h-3 fill-current" />
                                <span>Lecture on Topic</span>
                              </button>
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                          </div>

                          {/* Concepts Under Topic */}
                          {isExpanded && (
                            <div className="p-4 divide-y divide-slate-100 space-y-4">
                              {(topic.concepts || []).map((concept, cIdx) => (
                                <div key={concept.id} className="pt-3 first:pt-0 space-y-2">
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-xs text-slate-900">
                                          {cIdx + 1}. {concept.title}
                                        </span>
                                        <span
                                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                                            concept.difficulty === 'ADVANCED'
                                              ? 'bg-purple-50 text-purple-700 border border-purple-100'
                                              : concept.difficulty === 'INTERMEDIATE'
                                              ? 'bg-blue-50 text-blue-700 border border-blue-100'
                                              : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                          }`}
                                        >
                                          {concept.difficulty}
                                        </span>
                                      </div>
                                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                        {concept.definition}
                                      </p>
                                    </div>

                                    <button
                                      onClick={() => {
                                        onStartLecture(details.material, topic, concept);
                                        onClose();
                                      }}
                                      className="whitespace-nowrap px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-600 text-slate-700 hover:text-white text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer flex-shrink-0"
                                    >
                                      <Play className="w-3 h-3 fill-current" />
                                      <span>Focus Concept</span>
                                    </button>
                                  </div>

                                  {concept.keyPoints && concept.keyPoints.length > 0 && (
                                    <div className="pl-3 border-l-2 border-slate-200 text-[11px] text-slate-500 space-y-0.5">
                                      {concept.keyPoints.map((pt, pIdx) => (
                                        <p key={pIdx}>• {pt}</p>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: SEMANTIC CHUNKS VIEWER */}
              {activeTab === 'chunks' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                    <span>Total Chunks: {details.chunks.length}</span>
                    <span>Indexed for Retrieval & Grounding</span>
                  </div>

                  <div className="space-y-3">
                    {details.chunks.map((chk) => (
                      <div
                        key={chk.id}
                        className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 transition-colors space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                              Chunk #{chk.chunkIndex + 1}
                            </span>
                            <span className="text-xs font-bold text-slate-800">
                              {chk.heading || 'Section'}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-slate-500">
                            ~{chk.tokenCount} Tokens
                          </span>
                        </div>

                        <p className="text-xs text-slate-700 font-mono whitespace-pre-wrap leading-relaxed bg-white p-3 rounded-lg border border-slate-200/80">
                          {chk.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: CLEANED RAW SOURCE TEXT */}
              {activeTab === 'rawText' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                    <span>Source Characters: {details.material.extractedText?.length || 0}</span>
                    <span>Normalized Markdown</span>
                  </div>
                  <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 text-xs font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto max-h-[450px]">
                    {details.material.extractedText || 'No source text available.'}
                  </pre>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showExportModal && details?.material && (
        <StudyPackExportModal
          material={details.material}
          token={token}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
};
