import React from 'react';
import { FormativeDiagnosticResult } from '../server/diagnosticEngine';
import {
  Brain,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  ArrowRight,
  TrendingUp,
  RotateCcw,
  Target,
  Layers,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  Headphones,
} from 'lucide-react';
import { useLecturerVoice } from '../lib/useLecturerVoice';

interface FormativeDiagnosticInspectorProps {
  diagnostic: FormativeDiagnosticResult;
  onApplyStrategy?: (strategy: string, actionPrompt: string) => void;
  onClose?: () => void;
}

export const FormativeDiagnosticInspector: React.FC<FormativeDiagnosticInspectorProps> = ({
  diagnostic,
  onApplyStrategy,
  onClose,
}) => {
  const voiceEngine = useLecturerVoice();

  const handleReadDiagnosticAloud = () => {
    const feedbackText = `Diagnostic Evaluation for ${diagnostic.conceptName}. 
Your comprehension score is ${diagnostic.score} percent, graded as ${diagnostic.level.replace(/_/g, ' ')}. 
${diagnostic.feedbackMessage || diagnostic.analysis}
${diagnostic.misconceptions && diagnostic.misconceptions.length > 0 ? `Flagged misconception: ${diagnostic.misconceptions.join('. ')}. ${diagnostic.contrastiveCorrection || ''}` : 'All foundational invariants were successfully identified.'}
Recommended next step: Re-teach using ${diagnostic.recommendedStrategy.replace(/_/g, ' ')}.`;

    voiceEngine.speakText(feedbackText, 'diagnostic_modal_speech');
  };

  const getLevelBadge = (level: string, score: number) => {
    switch (level) {
      case 'MASTERED':
        return {
          bg: 'bg-emerald-500/10 text-emerald-700 border-emerald-300',
          label: 'Mastered',
          sub: 'Exemplary Invariant Grasp',
          scoreBg: 'bg-emerald-600',
          textColor: 'text-emerald-700',
        };
      case 'UNDERSTOOD':
        return {
          bg: 'bg-blue-500/10 text-blue-700 border-blue-300',
          label: 'Understood',
          sub: 'Solid Core Mechanics',
          scoreBg: 'bg-blue-600',
          textColor: 'text-blue-700',
        };
      case 'PARTIALLY_UNDERSTOOD':
        return {
          bg: 'bg-amber-500/10 text-amber-700 border-amber-300',
          label: 'Partially Understood',
          sub: 'Conceptual Gaps Detected',
          scoreBg: 'bg-amber-500',
          textColor: 'text-amber-700',
        };
      default:
        return {
          bg: 'bg-rose-500/10 text-rose-700 border-rose-300',
          label: 'Not Understood',
          sub: 'Fundamental Misconceptions',
          scoreBg: 'bg-rose-600',
          textColor: 'text-rose-700',
        };
    }
  };

  const badge = getLevelBadge(diagnostic.level, diagnostic.score);

  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      {/* Top Header */}
      <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-400">
                Socratic Formative Rubric
              </span>
              <span className="text-[10px] text-slate-400">
                {diagnostic.groundedSourceHeading || 'Course Material'}
              </span>
            </div>
            <h4 className="text-sm font-bold text-white">
              Understanding Assessment: {diagnostic.conceptName}
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {voiceEngine.isSpeaking ? (
            <button
              onClick={voiceEngine.stop}
              className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Stop readout"
            >
              <Square className="w-3 h-3 fill-white" />
              <span>Stop Voice</span>
            </button>
          ) : (
            <button
              onClick={handleReadDiagnosticAloud}
              className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Listen to lecturer diagnostic explanation"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Read Feedback Aloud</span>
            </button>
          )}

          {onClose && (
            <button
              onClick={() => {
                if (voiceEngine.isSpeaking) voiceEngine.stop();
                if (onClose) onClose();
              }}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer text-xs"
            >
              ✕ Close
            </button>
          )}
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Tier & Score Header Card */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center text-white font-extrabold text-lg shadow-sm ${badge.scoreBg}`}
            >
              <span>{diagnostic.score}%</span>
              <span className="text-[9px] font-normal uppercase opacity-90">Score</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${badge.bg}`}
                >
                  {badge.label}
                </span>
                <span className="text-xs text-slate-500 font-medium">{badge.sub}</span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Evaluated against course grounding invariants and causality boundaries.
              </p>
            </div>
          </div>
        </div>

        {/* Cognitive Breakdown (Bloom's Dimensions) */}
        {diagnostic.bloomBreakdown && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>Cognitive Depth Dimensions</span>
              </span>
              <span className="text-[11px] font-normal text-slate-400">Bloom's Taxonomy Alignment</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 font-medium block">Recall</span>
                <span className="text-sm font-extrabold text-slate-800">
                  {diagnostic.bloomBreakdown.recall}%
                </span>
                <div className="w-full bg-slate-200 h-1 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all"
                    style={{ width: `${diagnostic.bloomBreakdown.recall}%` }}
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 font-medium block">Mechanics</span>
                <span className="text-sm font-extrabold text-slate-800">
                  {diagnostic.bloomBreakdown.mechanism}%
                </span>
                <div className="w-full bg-slate-200 h-1 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all"
                    style={{ width: `${diagnostic.bloomBreakdown.mechanism}%` }}
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 font-medium block">Invariants</span>
                <span className="text-sm font-extrabold text-slate-800">
                  {diagnostic.bloomBreakdown.invariant}%
                </span>
                <div className="w-full bg-slate-200 h-1 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all"
                    style={{ width: `${diagnostic.bloomBreakdown.invariant}%` }}
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] text-slate-500 font-medium block">Synthesis</span>
                <span className="text-sm font-extrabold text-slate-800">
                  {diagnostic.bloomBreakdown.synthesis}%
                </span>
                <div className="w-full bg-slate-200 h-1 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all"
                    style={{ width: `${diagnostic.bloomBreakdown.synthesis}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Qualitative Analysis */}
        <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-100 text-xs text-slate-800 leading-relaxed">
          <span className="font-bold text-blue-900 block mb-1">Qualitative Analysis:</span>
          <p>{diagnostic.analysis}</p>
        </div>

        {/* Misconception Alert (if any) */}
        {diagnostic.misconceptions && diagnostic.misconceptions.length > 0 && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-rose-800">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Flagged Conceptual Misconception</span>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-rose-800 font-medium">
              {diagnostic.misconceptions.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>

            {diagnostic.contrastiveCorrection && (
              <div className="mt-2 pt-2 border-t border-rose-200/60 text-rose-950 bg-rose-100/50 p-2.5 rounded-lg text-[11px] leading-relaxed">
                <span className="font-bold block text-rose-900">Contrastive Reality:</span>
                <p>{diagnostic.contrastiveCorrection}</p>
              </div>
            )}
          </div>
        )}

        {/* Evidence & Gaps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Correct Evidence Found */}
          <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>What You Correctly Identified</span>
            </div>
            {diagnostic.evidenceFound.length > 0 ? (
              <ul className="text-[11px] text-emerald-900 space-y-1 pl-4 list-disc">
                {diagnostic.evidenceFound.map((e, idx) => (
                  <li key={idx}>{e}</li>
                ))}
              </ul>
            ) : (
              <p className="text-[11px] text-slate-500 italic">No formal evidence detected yet.</p>
            )}
          </div>

          {/* Missing Invariant Points */}
          <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
              <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Missing Foundational Points</span>
            </div>
            {diagnostic.missingKeyPoints.length > 0 ? (
              <ul className="text-[11px] text-amber-900 space-y-1 pl-4 list-disc">
                {diagnostic.missingKeyPoints.map((m, idx) => (
                  <li key={idx}>{m}</li>
                ))}
              </ul>
            ) : (
              <p className="text-[11px] text-emerald-700 font-semibold">
                ✓ All required foundational invariants present!
              </p>
            )}
          </div>
        </div>

        {/* Adaptive Re-teaching Action Button */}
        {diagnostic.level !== 'MASTERED' && onApplyStrategy && (
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-600">
              <span className="font-semibold text-slate-800">Recommended Strategy: </span>
              <span className="font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                {diagnostic.recommendedStrategy}
              </span>
            </div>

            <button
              onClick={() =>
                onApplyStrategy(
                  diagnostic.recommendedStrategy,
                  `Please re-teach **${diagnostic.conceptName}** using **${diagnostic.recommendedStrategy}** to address my misconception: "${
                    diagnostic.misconceptions[0] || 'Clarify the exact causality'
                  }".`
                )
              }
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Re-Teach with {diagnostic.recommendedStrategy.replace(/_/g, ' ')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
