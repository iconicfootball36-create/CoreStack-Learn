import React from 'react';
import { X, CheckCircle2, Brain, ArrowRight, ShieldCheck, Sparkles, Flame } from 'lucide-react';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartLearning: () => void;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({ isOpen, onClose, onStartLearning }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 text-slate-900 shadow-2xl space-y-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-mono font-semibold uppercase mb-3">
            <span>Pedagogical Architecture</span>
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900">
            How CoreStack Learn Solves Real Comprehension
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Why traditional studying and simple AI chat fail—and how our cognitive loop ensures true mastery.
          </p>
        </div>

        {/* Breakdown Steps */}
        <div className="space-y-4 text-xs sm:text-sm text-slate-700">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                1
              </span>
              Strict Source Material Grounding
            </h4>
            <p className="text-slate-600 leading-relaxed">
              When you upload PDFs, DOCX, or text notes, Gemini parses the exact syllabus. The AI lecturer teaches directly from what your professor assigned—no distracting random trivia.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                2
              </span>
              Conversational Pacing & Bite-Sized Delivery
            </h4>
            <p className="text-slate-600 leading-relaxed">
              Instead of 10-paragraph textbook dumps, the AI explains single concepts conversationally in 1-2 paragraphs and checks if you are following along.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                3
              </span>
              The Continuous Understanding Check
            </h4>
            <p className="text-slate-600 leading-relaxed">
              After explaining a concept, the lecturer asks you to explain or answer an application scenario. It evaluates for genuine understanding vs surface-level memorization.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                4
              </span>
              Adaptive Re-Teaching (7 Strategies)
            </h4>
            <p className="text-slate-600 leading-relaxed">
              If you hold a misconception, the AI doesn't just repeat itself. It switches to real-world analogies, step-by-step logic, concrete examples, or Socratic questions until you get it.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-slate-600 hover:text-slate-900 text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={() => {
              onClose();
              onStartLearning();
            }}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-md shadow-blue-600/20 flex items-center gap-2 cursor-pointer"
          >
            <span>Start Learning Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
