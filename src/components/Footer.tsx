import React from 'react';
import { BookOpen, ArrowRight, Sparkles, ShieldCheck, Heart } from 'lucide-react';

interface FooterProps {
  onStartLearning: () => void;
  onOpenHowItWorks: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onStartLearning, onOpenHowItWorks }) => {
  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800/80">
      {/* Final Pre-Footer Call to Action */}
      <div className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 border-b border-slate-800/80 bg-gradient-to-b from-slate-900 to-slate-950 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-400 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Ready for Deep Learning?</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
            Your personal lecturer is ready when you are.
          </h2>

          <p className="text-base sm:text-lg text-slate-400 max-w-xl mx-auto">
            Stop skimming and start learning in a way that actually checks understanding. Upload your material and build real mastery, one concept at a time.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onStartLearning}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-base transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>Start Learning Free</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={onOpenHowItWorks}
              className="w-full sm:w-auto px-7 py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-base font-semibold border border-slate-700 transition-colors cursor-pointer"
            >
              See How It Works
            </button>
          </div>
        </div>
      </div>

      {/* Main Footer Links & Branding */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <span className="font-extrabold text-lg tracking-tight text-white font-sans">CoreStack <span className="text-blue-500">Learn</span></span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-sm leading-relaxed">
              AI-powered personalized learning platform that adapts teaching to the individual student, continuously verifies comprehension, and eliminates illusions of competence.
            </p>
            <div className="text-[11px] text-slate-400 flex items-center gap-2 pt-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Production architecture foundation · Ready for deep learning</span>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-2 text-xs sm:text-sm">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-xs">Product</h4>
            <ul className="space-y-1.5 text-slate-400">
              <li><a href="#how-it-works" className="hover:text-blue-400 transition-colors">How It Works</a></li>
              <li><a href="#pedagogical-loop" className="hover:text-blue-400 transition-colors">Cognitive Loop</a></li>
              <li><a href="#features" className="hover:text-blue-400 transition-colors">Key Features</a></li>
              <li><a href="#architecture" className="hover:text-blue-400 transition-colors">System Architecture</a></li>
            </ul>
          </div>

          {/* Academic Principle */}
          <div className="space-y-2 text-xs sm:text-sm">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-xs">Pedagogical Core</h4>
            <p className="text-xs text-slate-400 leading-relaxed italic">
              "The AI should not simply move forward because it has finished explaining. It should continuously check whether the student actually understands."
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} CoreStack Learn. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built for deep comprehension & genuine academic mastery
          </p>
        </div>
      </div>
    </footer>
  );
};
