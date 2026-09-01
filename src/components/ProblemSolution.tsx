import React from 'react';
import { AlertCircle, CheckCircle2, XCircle, ArrowRight, ShieldAlert, Sparkles, Brain, Sliders, Users, FileText } from 'lucide-react';

export const ProblemSolution: React.FC = () => {
  return (
    <section id="problem-solution" className="py-20 bg-white text-slate-900 border-t border-slate-200 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider mb-4 border border-blue-100">
            <span>Why CoreStack Learn</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            The Fundamental Flaw in Traditional Education & Generic AI Chatbots
          </h2>
          <p className="text-base sm:text-lg text-slate-600 mt-3">
            Reading is not understanding. Summarizing is not teaching.
          </p>
        </div>

        {/* Problem vs Solution Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Traditional & Generic Chatbot Flaws */}
          <div className="p-8 rounded-2xl bg-rose-50/40 border border-rose-200/80 flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center border border-rose-200">
                  <XCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">The Traditional & Generic AI Flaw</h3>
                  <p className="text-xs text-rose-600 font-medium">One-speed lectures & passive text dumps</p>
                </div>
              </div>

              <div className="space-y-4 text-sm text-slate-600">
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-rose-100 shadow-sm">
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 block text-xs uppercase tracking-wider mb-0.5">Fixed Pace for Everyone</strong>
                    <p className="text-xs text-slate-600">Classrooms and video lectures move at one average speed. If you get confused in minute 5, the remaining 45 minutes are lost.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-rose-100 shadow-sm">
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 block text-xs uppercase tracking-wider mb-0.5">Chatbots Simply Dump Summaries</strong>
                    <p className="text-xs text-slate-600">Standard LLMs output 1,000-word walls of text. They assume that because they generated an answer, the student now understands it.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-rose-100 shadow-sm">
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 block text-xs uppercase tracking-wider mb-0.5">Undetected Misconceptions</strong>
                    <p className="text-xs text-slate-600">Students believe they understood because they nodded along, only to fail during exams when tested on nuance and application.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-rose-200/60 text-xs text-slate-600">
              <span className="font-semibold text-rose-600">Result: </span>
              Passive illusion of competence, low retention, and study frustration.
            </div>
          </div>

          {/* CoreStack Learn Solution */}
          <div className="p-8 rounded-2xl bg-white border-2 border-blue-600 flex flex-col justify-between shadow-xl shadow-blue-500/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">The CoreStack Learn Method</h3>
                  <p className="text-xs text-blue-600 font-semibold">Personalized AI lecturer with active verification</p>
                </div>
              </div>

              <div className="space-y-4 text-sm text-slate-700">
                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 block text-xs uppercase tracking-wider mb-0.5">Grounded in Your Own Notes</strong>
                    <p className="text-xs text-slate-600">Upload your syllabus, lecture slides, or textbooks. The AI teaches strictly from your materials without fabricating extraneous trivia.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 block text-xs uppercase tracking-wider mb-0.5">Mandatory Understanding Checks</strong>
                    <p className="text-xs text-slate-600">The lecturer explains in conversational bites and asks targeted questions to verify comprehension before moving on.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-900 block text-xs uppercase tracking-wider mb-0.5">Adaptive Re-Teaching Engine</strong>
                    <p className="text-xs text-slate-600">If you struggle, the AI diagnoses the specific misconception and explains using analogies, step-by-step logic, or concrete examples.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 text-xs text-slate-700">
              <span className="font-semibold text-blue-600">Result: </span>
              Deep conceptual mastery, retained long-term, backed by repeated learning evidence.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
