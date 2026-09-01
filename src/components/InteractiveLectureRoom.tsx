import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import {
  Brain,
  Send,
  Sliders,
  ChevronRight,
  RefreshCw,
  Sparkles,
  BookOpen,
  HelpCircle,
  FileText,
  Lightbulb,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Info,
  Maximize2,
  ExternalLink,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  Headphones
} from 'lucide-react';
import { StudyMaterial, TeachingStrategy, User, Topic, Concept, DocumentChunk } from '../types/database';
import { FormativeDiagnosticResult } from '../server/diagnosticEngine';
import { FormativeDiagnosticInspector } from './FormativeDiagnosticInspector';
import { useLecturerVoice } from '../lib/useLecturerVoice';
import { LecturerVoiceControlBar } from './LecturerVoiceControlBar';
import { StudyPackExportModal } from './StudyPackExportModal';

interface GroundedSource {
  heading: string;
  excerpt: string;
  chunkIndex: number;
}

interface MessageItem {
  id: string;
  sender: 'student' | 'lecturer' | 'system';
  text: string;
  strategy?: TeachingStrategy;
  pedagogicalIntent?: string;
  groundedSources?: GroundedSource[];
  followUpQuestion?: string;
  suggestedActions?: string[];
  comprehensionScore?: number;
  time: string;
}

interface InteractiveLectureRoomProps {
  material: StudyMaterial | null;
  materials: StudyMaterial[];
  user: User | null;
  token: string | null;
  initialConcept?: string;
  onSelectMaterial: (m: StudyMaterial) => void;
  onOpenInspectModal: (materialId: string) => void;
}

export const InteractiveLectureRoom: React.FC<InteractiveLectureRoomProps> = ({
  material,
  materials,
  user,
  token,
  initialConcept,
  onSelectMaterial,
  onOpenInspectModal,
}) => {
  const [activeConcept, setActiveConcept] = useState<string>(
    initialConcept || material?.title || 'Core Foundations'
  );
  const [activeStrategy, setActiveStrategy] = useState<TeachingStrategy>(
    user?.preferredStrategy || 'REAL_WORLD_ANALOGY'
  );

  const [inputMessage, setInputMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedSourceModal, setSelectedSourceModal] = useState<GroundedSource | null>(null);
  
  // Phase 8: Formative Understanding & Socratic Diagnostic State
  const [currentDiagnostic, setCurrentDiagnostic] = useState<FormativeDiagnosticResult | null>(null);
  const [isEvaluatingDiagnostic, setIsEvaluatingDiagnostic] = useState(false);
  const [showDiagnosticInspector, setShowDiagnosticInspector] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Lecturer Voice Engine Hook (Multi-Voice Speech Synthesis)
  const voiceEngine = useLecturerVoice();

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initial welcome message
  const [messages, setMessages] = useState<MessageItem[]>(() => {
    const matTitle = material?.title || 'Distributed Systems & Operating Internals';
    return [
      {
        id: 'msg_init_1',
        sender: 'lecturer',
        text: `Hello **${user?.name?.split(' ')[0] || 'Scholar'}**! I am **Dr. CoreStack**, your dedicated AI Academic Lecturer.\n\nOur active session is strictly grounded in your course document: **"${matTitle}"**.\n\nI have calibrated our explanations to your **${user?.academicLevel || 'UNDERGRADUATE'}** level. We will learn until you achieve 100% conceptual mastery.`,
        pedagogicalIntent: 'Session initialization and academic baseline calibration.',
        suggestedActions: [
          'Explain the core mechanism simply',
          'Give me a real-world analogy',
          'Start with a diagnostic question',
        ],
        time: 'Just now',
      },
      {
        id: 'msg_init_2',
        sender: 'lecturer',
        text: `To calibrate our starting point on **${activeConcept}**:\n\nIn your own words, what is the fundamental problem or trade-off that **${activeConcept}** is designed to solve in this system?`,
        followUpQuestion: `What is the primary guarantee of ${activeConcept}?`,
        time: 'Just now',
      },
    ];
  });

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  // Update concept when initialConcept prop changes
  useEffect(() => {
    if (initialConcept && initialConcept !== activeConcept) {
      setActiveConcept(initialConcept);
    }
  }, [initialConcept]);

  const handleSendMessage = async (textToSend?: string, strategyOverride?: TeachingStrategy) => {
    const text = textToSend || inputMessage.trim();
    if (!text || isGenerating || !material || !token) return;

    setInputMessage('');
    const effectiveStrategy = strategyOverride || activeStrategy;

    const userMessage: MessageItem = {
      id: `msg_stu_${Date.now()}`,
      sender: 'student',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsGenerating(true);

    try {
      // Build conversation history
      const history = messages
        .filter((m) => m.sender !== 'system')
        .slice(-6)
        .map((m) => ({
          role: m.sender === 'student' ? ('user' as const) : ('assistant' as const),
          text: m.text,
        }));

      const res = await fetch('/api/lecturer/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          materialId: material.id,
          message: text,
          strategy: effectiveStrategy,
          conceptName: activeConcept,
          conversationHistory: history,
        }),
      });

      if (!res.ok) {
        throw new Error(`Lecturer returned ${res.status}`);
      }

      const data = await res.json();

      const aiMessage: MessageItem = {
        id: `msg_ai_${Date.now()}`,
        sender: 'lecturer',
        text: data.reply,
        strategy: data.strategyUsed,
        pedagogicalIntent: data.pedagogicalIntent,
        groundedSources: data.groundedSources,
        followUpQuestion: data.followUpQuestion,
        suggestedActions: data.suggestedActions,
        comprehensionScore: data.comprehensionScoreEstimate,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMessage]);

      // If auto-narration is active, immediately speak the lecturer response
      if (voiceEngine.autoNarrate && data.reply) {
        voiceEngine.speakText(data.reply, aiMessage.id);
      }
    } catch (err: any) {
      console.error('Lecturer dialogue error:', err);
      // Fallback local message
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_err_${Date.now()}`,
          sender: 'lecturer',
          text: `I experienced a brief connection interruption, but let's continue with **${activeConcept}**.\n\nKey principle: The fundamental mechanism ensures correctness by maintaining transactional isolation and fast cached lookups.`,
          pedagogicalIntent: 'Recovery fallback.',
          suggestedActions: ['Explain with analogy', 'Step by step breakdown', 'Ask me a quiz question'],
          time: 'Just now',
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStrategyChange = (newStrategy: TeachingStrategy, promptTitle: string) => {
    setActiveStrategy(newStrategy);
    handleSendMessage(`Please explain ${activeConcept} using the **${promptTitle}** approach.`, newStrategy);
  };

  // Phase 8: Trigger Socratic Diagnostic Check
  const handleRunSocraticDiagnostic = async (textToEvaluate?: string) => {
    if (!material || !token || isEvaluatingDiagnostic) return;

    // Use passed text or input message or last student reply
    const answer = textToEvaluate || inputMessage.trim();
    if (!answer) {
      // If student hasn't typed an answer yet, prompt them with a Socratic question
      handleGenerateSocraticCheck();
      return;
    }

    setIsEvaluatingDiagnostic(true);
    setInputMessage('');

    // Append student answer to chat if not already there
    const userMessage: MessageItem = {
      id: `msg_stu_diag_${Date.now()}`,
      sender: 'student',
      text: answer,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const res = await fetch('/api/diagnostic/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          materialId: material.id,
          conceptName: activeConcept,
          questionAsked: 'Explain the core invariant and state transitions in your own words.',
          studentAnswer: answer,
        }),
      });

      if (!res.ok) {
        throw new Error(`Diagnostic API returned ${res.status}`);
      }

      const diagnosticData: FormativeDiagnosticResult = await res.json();
      setCurrentDiagnostic(diagnosticData);
      setShowDiagnosticInspector(true);

      // Add Dr. CoreStack feedback message into stream
      const feedbackMsg: MessageItem = {
        id: `msg_diag_res_${Date.now()}`,
        sender: 'lecturer',
        text: `### 🎯 Socratic Understanding Assessment: **${diagnosticData.level.replace(/_/g, ' ')}** (${diagnosticData.score}%)\n\n${diagnosticData.feedbackMessage}\n\n${
          diagnosticData.misconceptions.length > 0
            ? `⚠️ **Misconception Identified**: ${diagnosticData.misconceptions[0]}\n\n${diagnosticData.contrastiveCorrection || ''}`
            : '✓ **No misconceptions detected.** Your conceptual causality is accurate!'
        }`,
        pedagogicalIntent: `Formative Diagnostic: ${diagnosticData.level} (${diagnosticData.score}%)`,
        comprehensionScore: diagnosticData.score,
        suggestedActions:
          diagnosticData.level !== 'MASTERED'
            ? [
                `Re-teach with ${diagnosticData.recommendedStrategy.replace(/_/g, ' ')}`,
                'Step-by-step causality breakdown',
                'Give me another Socratic check',
              ]
            : ['Advance to next topic in curriculum', 'Try high-difficulty exam quiz'],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, feedbackMsg]);
    } catch (err: any) {
      console.error('Diagnostic evaluation error:', err);
    } finally {
      setIsEvaluatingDiagnostic(false);
    }
  };

  // Generate a fresh Socratic check question
  const handleGenerateSocraticCheck = async () => {
    if (!material || !token || isGenerating) return;
    setIsGenerating(true);

    try {
      const res = await fetch('/api/diagnostic/socratic-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          materialId: material.id,
          conceptName: activeConcept,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const socraticMsg: MessageItem = {
          id: `msg_soc_${Date.now()}`,
          sender: 'lecturer',
          text: `### ❓ Socratic Understanding Check: ${activeConcept}\n\n${data.question}\n\n*Target Cognitive Focus: ${data.bloomTarget || 'Mechanism & Invariant'}*`,
          pedagogicalIntent: 'Formative Diagnostic Probe',
          suggestedActions: [
            'I will explain the mechanism in my words',
            'Explain simply first',
            'Give me a physical analogy',
          ],
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, socraticMsg]);
      }
    } catch (err) {
      console.error('Socratic question error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyDiagnosticStrategy = (strategy: string, actionPrompt: string) => {
    setShowDiagnosticInspector(false);
    setActiveStrategy(strategy as TeachingStrategy);
    handleSendMessage(actionPrompt, strategy as TeachingStrategy);
  };

  const handleReadLatestLecturerMessage = () => {
    const lecturerMsgs = messages.filter((m) => m.sender === 'lecturer');
    if (lecturerMsgs.length > 0) {
      const latest = lecturerMsgs[lecturerMsgs.length - 1];
      voiceEngine.speakText(latest.text, latest.id);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-200">
      {/* Main Dialogue Column (Left 8 Cols) */}
      <div className="lg:col-span-8 space-y-4">
        {/* Session Grounding Banner */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                  Grounded Session
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {user?.academicLevel || 'UNDERGRADUATE'} Level
                </span>
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Dr. CoreStack • {material?.title || 'Interactive Course Lecture'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {material && (
              <>
                <button
                  onClick={() => setShowExportModal(true)}
                  className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                  title="Generate Revision Study Pack & Flashcards"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>Export Pack</span>
                </button>

                <button
                  onClick={() => onOpenInspectModal(material.id)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                  title="View document chunks & curriculum graph"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>View Chunks</span>
                </button>
              </>
            )}

            <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Grounded AI Active</span>
            </div>
          </div>
        </div>

        {/* Phase 9: Multi-Voice Lecturer Audio & Speech Bar */}
        <LecturerVoiceControlBar
          voiceEngine={voiceEngine}
          onReadCurrentOrLast={handleReadLatestLecturerMessage}
        />

        {/* Conversation Stream */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5 max-h-[580px] overflow-y-auto">
          {messages.map((msg) => {
            const isThisMsgSpeaking = voiceEngine.isSpeaking && voiceEngine.activeMessageId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'student' ? 'items-end' : 'items-start'}`}
              >
                {/* Intent / Grounding Badge */}
                {msg.pedagogicalIntent && (
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 mb-1.5 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200">
                    <Sparkles className="w-3 h-3 text-blue-600" />
                    <span>Pedagogical Intent: {msg.pedagogicalIntent}</span>
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`p-4 sm:p-5 rounded-2xl text-xs sm:text-sm leading-relaxed max-w-[92%] transition-all ${
                    msg.sender === 'student'
                      ? 'bg-blue-600 text-white rounded-br-none shadow-sm'
                      : isThisMsgSpeaking
                      ? 'bg-blue-50/60 border-2 border-blue-500 text-slate-900 rounded-bl-none shadow-md ring-4 ring-blue-100'
                      : 'bg-slate-50 border border-slate-200 text-slate-900 rounded-bl-none shadow-xs'
                  }`}
                >
                  {/* Lecturer Top Action & Voice Readout Header */}
                  {msg.sender === 'lecturer' && (
                    <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-200/70">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-5 h-5 rounded-md ${voiceEngine.selectedPersona.avatarBg} flex items-center justify-center text-[10px] font-bold text-white shadow-xs`}
                        >
                          <Headphones className="w-3 h-3" />
                        </div>
                        <span className="text-[11px] font-bold text-slate-800">
                          {voiceEngine.selectedPersona.name}
                        </span>
                        {msg.strategy && (
                          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-blue-100/70 text-blue-700">
                            {msg.strategy.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>

                      {/* Read Out Button for this message */}
                      {isThisMsgSpeaking ? (
                        <div className="flex items-center gap-1 bg-blue-600 text-white px-2 py-0.5 rounded-lg text-[10px] font-bold shadow-xs">
                          {voiceEngine.isPaused ? (
                            <button
                              onClick={voiceEngine.resume}
                              className="flex items-center gap-1 hover:underline cursor-pointer"
                            >
                              <Play className="w-2.5 h-2.5 fill-white" />
                              <span>Resume</span>
                            </button>
                          ) : (
                            <button
                              onClick={voiceEngine.pause}
                              className="flex items-center gap-1 hover:underline cursor-pointer"
                            >
                              <Pause className="w-2.5 h-2.5 fill-white" />
                              <span>Pause</span>
                            </button>
                          )}
                          <span className="text-blue-300">|</span>
                          <button
                            onClick={voiceEngine.stop}
                            className="hover:text-blue-200 cursor-pointer p-0.5"
                            title="Stop reading"
                          >
                            <Square className="w-2.5 h-2.5 fill-white" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => voiceEngine.speakText(msg.text, msg.id)}
                          className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-blue-600 bg-white hover:bg-blue-50 px-2 py-1 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                          title="Read this explanation out loud with lecturer voice"
                        >
                          <Volume2 className="w-3 h-3 text-blue-600" />
                          <span>Read Aloud</span>
                        </button>
                      )}
                    </div>
                  )}

                  {msg.sender === 'student' ? (
                    <p className="whitespace-pre-line">{msg.text}</p>
                  ) : (
                    <div className="markdown-body space-y-2.5">
                      <Markdown>{msg.text}</Markdown>
                    </div>
                  )}

                  {/* Grounded Document Sources */}
                  {msg.groundedSources && msg.groundedSources.length > 0 && (
                    <div className="mt-3.5 pt-3 border-t border-slate-200/80 space-y-1.5">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        Strict Document Grounding ({msg.groundedSources.length} Source Chunks)
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.groundedSources.map((src, sIdx) => (
                          <button
                            key={sIdx}
                            onClick={() => setSelectedSourceModal(src)}
                            className="px-2 py-1 rounded bg-white hover:bg-blue-50 border border-slate-200 text-[11px] font-medium text-slate-700 hover:text-blue-700 transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <FileText className="w-3 h-3 text-blue-600" />
                            <span>
                              Chunk #{src.chunkIndex + 1}: {src.heading}
                            </span>
                            <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Suggested Next Action Chips */}
                {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5 max-w-[92%]">
                    {msg.suggestedActions.map((action, aIdx) => (
                      <button
                        key={aIdx}
                        onClick={() => handleSendMessage(action)}
                        disabled={isGenerating}
                        className="px-2.5 py-1 rounded-full bg-blue-50/70 hover:bg-blue-100 border border-blue-200/70 text-[11px] font-semibold text-blue-700 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                      >
                        <span>{action}</span>
                        <ArrowRight className="w-2.5 h-2.5 text-blue-500" />
                      </button>
                    ))}
                  </div>
                )}

                <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.time}</span>
              </div>
            );
          })}

          {isGenerating && (
            <div className="flex items-center gap-2 text-xs text-blue-600 font-mono py-2 animate-pulse bg-blue-50/50 p-3 rounded-xl border border-blue-100">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              <span>Dr. CoreStack is retrieving document chunks & formulating explanation...</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 px-1">
            <span className="flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>Answer or ask Dr. CoreStack to clarify:</span>
            </span>
            <span className="text-[11px] text-slate-400">Shift+Enter for newline</span>
          </div>

          <div className="flex items-center gap-2">
            <textarea
              rows={2}
              placeholder={`Explain ${activeConcept} or ask a question...`}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={isGenerating || isEvaluatingDiagnostic}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition-all resize-none"
            />

            <div className="flex flex-col gap-1.5 shrink-0">
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isGenerating || isEvaluatingDiagnostic}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Send message to Dr. CoreStack"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => handleRunSocraticDiagnostic()}
                disabled={isGenerating || isEvaluatingDiagnostic}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                title="Evaluate your explanation with Socratic 4-tier rubric"
              >
                {isEvaluatingDiagnostic ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Scoring...</span>
                  </>
                ) : (
                  <>
                    <span>🎯 Socratic Check</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Dynamic Pedagogical Controls & Course Focus (4 Cols) */}
      <div className="lg:col-span-4 space-y-4">
        {/* Active Material Selector */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-700">
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>Course Material Focus</span>
            </div>
          </div>

          {materials.length > 0 ? (
            <select
              value={material?.id || ''}
              onChange={(e) => {
                const found = materials.find((m) => m.id === e.target.value);
                if (found) onSelectMaterial(found);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-blue-600"
            >
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-xs text-slate-500">No course material uploaded yet.</p>
          )}

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase text-slate-500">Active Topic / Concept Focus</label>
            <input
              type="text"
              value={activeConcept}
              onChange={(e) => setActiveConcept(e.target.value)}
              placeholder="e.g. TLB Hit/Miss Ratio"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-600"
            />
          </div>
        </div>

        {/* Socratic Formative Diagnostic Action & Summary Card */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
              <Brain className="w-4 h-4 text-amber-500" />
              <span>Socratic Understanding Check</span>
            </div>
            {currentDiagnostic && (
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                currentDiagnostic.level === 'MASTERED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {currentDiagnostic.score}%
              </span>
            )}
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            Test your conceptual depth against Dr. CoreStack's 4-tier rubric (Not, Partially, Understood, Mastered) with automatic misconception detection.
          </p>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => handleGenerateSocraticCheck()}
              disabled={isGenerating || isEvaluatingDiagnostic}
              className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
              <span>Ask Check Question</span>
            </button>

            <button
              onClick={() => handleRunSocraticDiagnostic()}
              disabled={isGenerating || isEvaluatingDiagnostic}
              className="px-3 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Evaluate Input</span>
            </button>
          </div>

          {currentDiagnostic && (
            <button
              onClick={() => setShowDiagnosticInspector(true)}
              className="w-full mt-2 py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Inspect Full Rubric & Bloom Breakdown</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 5 Real-Time Pedagogical Control Buttons */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
            <Sliders className="w-4 h-4 text-blue-600" />
            <span>Pedagogical Controls</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Directly command Dr. CoreStack to adjust its teaching angle in real time:
          </p>

          <div className="space-y-2">
            <button
              onClick={() => handleStrategyChange('SIMPLE_EXPLANATION', 'Explain Simply')}
              disabled={isGenerating}
              className={`w-full text-left p-3 rounded-xl border text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                activeStrategy === 'SIMPLE_EXPLANATION'
                  ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-xs'
                  : 'bg-slate-50 hover:bg-blue-50/50 hover:text-blue-700 border-slate-200 text-slate-700'
              }`}
            >
              <div>
                <span className="font-bold block">💡 Explain Simply</span>
                <span className="text-[10px] text-slate-500 font-normal">First-principles intuition, no jargon</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={() => handleStrategyChange('REAL_WORLD_ANALOGY', 'Real-World Analogy')}
              disabled={isGenerating}
              className={`w-full text-left p-3 rounded-xl border text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                activeStrategy === 'REAL_WORLD_ANALOGY'
                  ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-xs'
                  : 'bg-slate-50 hover:bg-blue-50/50 hover:text-blue-700 border-slate-200 text-slate-700'
              }`}
            >
              <div>
                <span className="font-bold block">🌍 Real-World Analogy</span>
                <span className="text-[10px] text-slate-500 font-normal">Relatable physical models and parallels</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={() => handleStrategyChange('STEP_BY_STEP', 'Step-by-Step Logic')}
              disabled={isGenerating}
              className={`w-full text-left p-3 rounded-xl border text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                activeStrategy === 'STEP_BY_STEP'
                  ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-xs'
                  : 'bg-slate-50 hover:bg-blue-50/50 hover:text-blue-700 border-slate-200 text-slate-700'
              }`}
            >
              <div>
                <span className="font-bold block">🔢 Step-by-Step Logic</span>
                <span className="text-[10px] text-slate-500 font-normal">Deconstructed sequence of state transitions</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={() => handleStrategyChange('QUESTION_LED', 'Socratic Questioning')}
              disabled={isGenerating}
              className={`w-full text-left p-3 rounded-xl border text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                activeStrategy === 'QUESTION_LED'
                  ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-xs'
                  : 'bg-slate-50 hover:bg-blue-50/50 hover:text-blue-700 border-slate-200 text-slate-700'
              }`}
            >
              <div>
                <span className="font-bold block">❓ Socratic Question</span>
                <span className="text-[10px] text-slate-500 font-normal">Probing question for self-guided discovery</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={() => handleStrategyChange('ACADEMIC_DEEP_DIVE', 'Academic Deep Dive')}
              disabled={isGenerating}
              className={`w-full text-left p-3 rounded-xl border text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                activeStrategy === 'ACADEMIC_DEEP_DIVE'
                  ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-xs'
                  : 'bg-slate-50 hover:bg-blue-50/50 hover:text-blue-700 border-slate-200 text-slate-700'
              }`}
            >
              <div>
                <span className="font-bold block">🔬 Academic Deep Dive</span>
                <span className="text-[10px] text-slate-500 font-normal">Formal mathematical proofs & invariants</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Master Invariant & Mastery Tracker Box */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-900 to-indigo-950 text-white shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-300">
              Core Invariant
            </span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-blue-800/80 text-blue-200">
              Target: 100% Mastery
            </span>
          </div>

          <h4 className="font-extrabold text-sm text-white">
            Cognitive Mastery Loop
          </h4>

          <p className="text-xs text-blue-100/80 leading-relaxed">
            Dr. CoreStack tracks your responses across 5 Bloom cognitive dimensions. If any misconception is detected, contrastive re-teaching triggers automatically.
          </p>
        </div>
      </div>

      {/* Formative Socratic Diagnostic Modal */}
      {showDiagnosticInspector && currentDiagnostic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl">
            <FormativeDiagnosticInspector
              diagnostic={currentDiagnostic}
              onApplyStrategy={handleApplyDiagnosticStrategy}
              onClose={() => setShowDiagnosticInspector(false)}
            />
          </div>
        </div>
      )}

      {/* Grounded Source Chunk Modal */}
      {selectedSourceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl p-6 sm:p-7 rounded-2xl bg-white border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase text-emerald-700">
                    Source Document Grounding
                  </span>
                  <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                    Chunk #{selectedSourceModal.chunkIndex + 1}: {selectedSourceModal.heading}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedSourceModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 max-h-72 overflow-y-auto">
              <p className="text-xs text-slate-800 font-mono leading-relaxed whitespace-pre-wrap">
                {selectedSourceModal.excerpt}
              </p>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
              <span>Extracted directly from uploaded course notes</span>
              <button
                onClick={() => setSelectedSourceModal(null)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Academic Study Pack & Revision Guide Modal */}
      {showExportModal && material && (
        <StudyPackExportModal
          material={material}
          token={token}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
};
