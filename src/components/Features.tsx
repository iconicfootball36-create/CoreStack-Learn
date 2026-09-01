import React from 'react';
import {
  FileText,
  Brain,
  Sliders,
  RotateCcw,
  HelpCircle,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Zap,
} from 'lucide-react';

export const Features: React.FC = () => {
  const features = [
    {
      icon: FileText,
      title: 'Learn From Your Materials',
      badge: 'PDF • DOCX • TXT',
      description:
        'Upload your lecture slides, class notes, or textbooks. The AI analyzes the curriculum and strictly bounds its lessons to what you need to study.',
      highlight: 'Zero unrelated hallucinations',
    },
    {
      icon: Brain,
      title: 'Personal AI Lecturer',
      badge: 'Bite-Sized Lessons',
      description:
        'Avoids endless walls of text. Teaches conversationally, concept by concept, with patient explanations and relevant contextual examples.',
      highlight: 'Conversational pacing',
    },
    {
      icon: Sliders,
      title: 'Real-Time Student Controls',
      badge: 'Interactive Triggers',
      description:
        'Take control during any lesson: "Explain More Simply", "Give Me an Example", "Explain Another Way", "Go Deeper", or "Ask Me a Question".',
      highlight: 'Dynamic lesson steering',
    },
    {
      icon: RotateCcw,
      title: 'Adaptive Re-Teaching Engine',
      badge: '7 Pedagogical Strategies',
      description:
        'When you struggle, the AI diagnoses the specific misconception and automatically switches to analogies, step-by-step logic, or practical comparisons.',
      highlight: 'Never repeats the same dead-end explanation',
    },
    {
      icon: HelpCircle,
      title: 'Grounded Smart Quizzes',
      badge: 'Targeted Assessments',
      description:
        'Generates multiple choice, true/false, and short explanation questions directly backed by your source documents with immediate pedagogical feedback.',
      highlight: 'Explains why answers are correct',
    },
    {
      icon: TrendingUp,
      title: 'Weakness Detection & Mastery Radar',
      badge: 'Evidence-Based',
      description:
        'Tracks concepts across 4 understanding levels (Not Understood, Partially Understood, Understood, Mastered) based on repeated evidence.',
      highlight: 'Visual mastery tracking',
    },
  ];

  return (
    <section id="features" className="py-20 bg-white text-slate-900 border-t border-slate-200 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Built for Deep Comprehension</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Features Designed Around How Humans Learn
          </h2>
          <p className="text-base sm:text-lg text-slate-600 mt-3">
            Every feature in CoreStack Learn is built to verify, challenge, and solidify your understanding.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/5 transition-all flex flex-col justify-between group shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors border border-blue-100">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      {f.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {f.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {f.description}
                  </p>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs text-blue-600 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{f.highlight}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
