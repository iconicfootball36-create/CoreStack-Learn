import React, { useState } from 'react';
import {
  Upload,
  BookOpen,
  ListOrdered,
  Sparkles,
  HelpCircle,
  Brain,
  AlertTriangle,
  RotateCcw,
  CheckCircle,
  Award,
  ChevronRight,
  Flame,
} from 'lucide-react';

interface Step {
  number: number;
  name: string;
  shortDesc: string;
  fullDesc: string;
  icon: React.ElementType;
  systemAction: string;
  outcome: string;
}

const STEPS: Step[] = [
  {
    number: 1,
    name: 'Upload',
    shortDesc: 'Submit your raw materials',
    fullDesc:
      'Upload your PDF lecture notes, course DOCX files, or TXT study materials. The system validates and securely parses the documents.',
    icon: Upload,
    systemAction: 'Text extraction, structure cleaning, and boundary chunking',
    outcome: 'Structured document repository with preserved academic headings',
  },
  {
    number: 2,
    name: 'Understand Material',
    shortDesc: 'AI analyzes curriculum structure',
    fullDesc:
      'Gemini studies your source document to identify primary subjects, topics, key concepts, definitions, and prerequisite hierarchies.',
    icon: BookOpen,
    systemAction: 'Curricular semantic analysis & atomic concept mapping',
    outcome: 'Structured curriculum course graph with defined learning difficulty',
  },
  {
    number: 3,
    name: 'Create Learning Plan',
    shortDesc: 'Generates optimal study pathway',
    fullDesc:
      'Builds a customized, ordered study schedule organized from foundational prerequisites to advanced concepts.',
    icon: ListOrdered,
    systemAction: 'Topological concept sequencing & time estimation',
    outcome: 'Personalized course syllabus with topic breakdown',
  },
  {
    number: 4,
    name: 'Teach & Ask Questions',
    shortDesc: 'Conversational lecturing & check-ins',
    fullDesc:
      'Your AI lecturer introduces each concept in conversational segments, using clear examples, and immediately tests your comprehension.',
    icon: Sparkles,
    systemAction: 'Conversational teaching turns with grounded check questions',
    outcome: 'Active learning engagement rather than passive reading',
  },
  {
    number: 5,
    name: 'Check & Identify Weaknesses',
    shortDesc: 'Evaluates your genuine comprehension',
    fullDesc:
      'The cognitive engine evaluates your reply for accuracy, completeness, and specific misconceptions, categorizing your understanding level.',
    icon: Brain,
    systemAction: 'Cognitive understanding rubric (4 levels: Not, Partially, Understood, Mastered)',
    outcome: 'Pinpointed diagnostic of exact conceptual misunderstandings',
  },
  {
    number: 6,
    name: 'Re-teach Differently & Master',
    shortDesc: 'Adaptive strategies & practice',
    fullDesc:
      'If you struggle, the AI pivots to real-world analogies, step-by-step proofs, or Socratic guidance until you achieve genuine, proven mastery.',
    icon: Award,
    systemAction: '7 Adaptive pedagogical strategies + Grounded adaptive quizzes',
    outcome: 'Verified mastery, tracked over time with zero guesswork',
  },
];

export const HowItWorks: React.FC = () => {
  const [selectedStepIndex, setSelectedStepIndex] = useState(0);
  const activeStep = STEPS[selectedStepIndex];

  return (
    <section id="how-it-works" className="py-20 bg-[#F8FAFC] text-slate-900 border-t border-slate-200 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider mb-4">
            <Flame className="w-3.5 h-3.5" />
            <span>The Cognitive Methodology</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            How CoreStack Learn Works
          </h2>
          <p className="text-base sm:text-lg text-slate-600 mt-3">
            A continuous loop engineered to transform raw study notes into deep, verified understanding.
          </p>

          {/* Quick Flow Ribbon */}
          <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-2 p-2 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-700 shadow-sm">
            <span className="text-blue-600 font-bold">Upload</span>
            <span className="text-slate-400">→</span>
            <span>Understand</span>
            <span className="text-slate-400">→</span>
            <span>Plan</span>
            <span className="text-slate-400">→</span>
            <span>Teach</span>
            <span className="text-slate-400">→</span>
            <span>Check</span>
            <span className="text-slate-400">→</span>
            <span className="text-rose-600 font-medium">Re-teach</span>
            <span className="text-slate-400">→</span>
            <span>Practice</span>
            <span className="text-slate-400">→</span>
            <span className="text-emerald-600 font-bold">Master</span>
          </div>
        </div>

        {/* Step Selector Horizontal / Grid Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isSelected = selectedStepIndex === idx;
            return (
              <button
                key={step.number}
                onClick={() => setSelectedStepIndex(idx)}
                className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between h-32 cursor-pointer ${
                  isSelected
                    ? 'bg-white border-blue-600 text-slate-900 shadow-md ring-1 ring-blue-500/20'
                    : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {step.number}
                  </div>
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">{step.name}</div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">{step.shortDesc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Detailed Step Inspector Box */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg border border-blue-100">
                  {activeStep.number}
                </div>
                <div>
                  <span className="text-xs font-mono uppercase tracking-wider text-blue-600 font-semibold">Step {activeStep.number} of 6</span>
                  <h3 className="text-2xl font-bold text-slate-900">{activeStep.name}</h3>
                </div>
              </div>

              <p className="text-slate-700 text-base leading-relaxed">{activeStep.fullDesc}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    System Architecture Execution
                  </span>
                  <p className="text-xs text-slate-700 font-mono">{activeStep.systemAction}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 block mb-1">
                    Student Pedagogical Outcome
                  </span>
                  <p className="text-xs text-slate-700 font-mono">{activeStep.outcome}</p>
                </div>
              </div>
            </div>

            {/* Visual Indicator of Pedagogical Rule */}
            <div className="lg:col-span-5 p-6 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-2">
                <Brain className="w-4 h-4" />
                <span>The CoreStack Principle</span>
              </div>
              <blockquote className="text-xs sm:text-sm text-slate-700 italic border-l-2 border-blue-600 pl-3 leading-relaxed">
                "The AI should not simply move forward because it has finished explaining. It should continuously check whether the student actually understands."
              </blockquote>
              <p className="text-[11px] text-slate-500 pt-2">
                Unlike ordinary study assistants, CoreStack Learn will stop, diagnose misconceptions, and re-explain using 7 alternative strategies before giving you credit.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
