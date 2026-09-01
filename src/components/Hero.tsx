import React from 'react';
import { ArrowRight, PlayCircle, Sparkles, CheckCircle2, ShieldCheck, Cpu, Brain, BookOpen } from 'lucide-react';

interface HeroProps {
  onStartLearning: () => void;
  onSeeHowItWorks: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onStartLearning, onSeeHowItWorks }) => {
  return (
    <section id="hero-section" className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-gradient-to-b from-white via-[#F8FAFC] to-slate-100/60 text-slate-900 border-b border-slate-200">
      {/* Background Subtle Grid Accent */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:28px_28px] opacity-40 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>AI Personal Lecturer • Not a Simple Chatbot</span>
          </div>

          {/* Primary Positioning Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 font-sans leading-[1.1] mb-6">
            Learn Until You{' '}
            <span className="text-blue-600">
              Understand.
            </span>
          </h1>

          {/* Supporting Message */}
          <p className="text-lg sm:text-xl text-slate-600 leading-relaxed font-normal mb-10 max-w-2xl mx-auto">
            Upload your study materials and get a personal AI lecturer that teaches at your pace, checks your understanding, and helps you master every topic.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
            <button
              id="btn-hero-start"
              onClick={onStartLearning}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-900 text-white font-bold text-base hover:bg-slate-800 shadow-md shadow-slate-900/10 hover:shadow-slate-900/20 transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              id="btn-hero-how-it-works"
              onClick={onSeeHowItWorks}
              className="w-full sm:w-auto px-7 py-4 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-bold text-base border border-slate-200 shadow-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <PlayCircle className="w-4 h-4 text-blue-600" />
              <span>See How It Works</span>
            </button>
          </div>

          {/* Grounding and Pedagogical Trust Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 border-t border-slate-200 text-left">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Strict Source Grounding</h4>
                <p className="text-xs text-slate-500 mt-0.5">Teaches directly from your notes. Never invents unsupported claims.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Continuous Verification</h4>
                <p className="text-xs text-slate-500 mt-0.5">Asks targeted check questions before progressing to new concepts.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">7 Re-Teaching Strategies</h4>
                <p className="text-xs text-slate-500 mt-0.5">Stuck? The lecturer switches to analogies, step-by-step, or examples.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
