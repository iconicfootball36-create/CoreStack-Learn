import React, { useState } from 'react';
import {
  Brain,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  BookOpen,
  ArrowRight,
  HelpCircle,
  Lightbulb,
  Check,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { TeachingStrategy, UnderstandingLevel } from '../types/database';

interface Scenario {
  id: string;
  subject: string;
  topicTitle: string;
  conceptTitle: string;
  sourceExcerpt: string;
  lecturerExplanation: string;
  checkQuestion: string;
  studentOptions: Array<{
    label: string;
    studentReply: string;
    level: UnderstandingLevel;
    score: number;
    misconception: string;
    reTeachingStrategy: TeachingStrategy;
    reTeachingExplanation: string;
    reTeachingQuestion: string;
  }>;
}

const SCENARIOS: Scenario[] = [
  {
    id: 'cs',
    subject: 'Computer Science',
    topicTitle: 'Distributed Systems',
    conceptTitle: 'The CAP Theorem & Network Partitions',
    sourceExcerpt:
      'In a network partition scenario (P), a distributed data store cannot guarantee both Consistency (C) and Availability (A). The system architect must choose whether to accept stale reads to keep serving clients (AP) or reject requests to prevent data inconsistency (CP).',
    lecturerExplanation:
      'Welcome! Today we are studying the CAP Theorem. The foundational rule is simple: when network cables are cut or machines lose contact (a partition), you cannot have both perfect instantaneous consistency and 100% availability. You must choose between returning accurate data or answering every request.',
    checkQuestion:
      'Imagine your server in London cannot reach your server in New York due to a fiber outage. A user in London tries to update their password. If your system chooses Consistency (CP), what must happen to that request?',
    studentOptions: [
      {
        label: 'Misconception (Confuses Availability with Consistency)',
        studentReply:
          'The London server will immediately update the password and let the user log in everywhere because consistency means the user always gets a fast response.',
        level: 'PARTIALLY_UNDERSTOOD',
        score: 45,
        misconception: 'Confused high availability (instant response) with consistency (cluster-wide agreement).',
        reTeachingStrategy: 'REAL_WORLD_ANALOGY',
        reTeachingExplanation:
          'Let’s look at this with a simple bank ledger analogy: Imagine two bank tellers with a broken phone line between them. If a customer deposits $100 with Teller 1, Teller 2 doesn’t know yet. If you demand perfect consistency (CP), Teller 2 cannot let anyone withdraw until the phone line is fixed. If they answered anyway, they might give away money that was already spent. In CP mode, the system pauses or rejects the request until both sides can agree.',
        reTeachingQuestion:
          'With that bank teller picture in mind: why does a CP system choose to show an error rather than allowing a split-brain write?',
      },
      {
        label: 'Clear Mastery',
        studentReply:
          'The London server must either refuse the write request or wait until the New York server is reachable again, because proceeding without New York’s consensus would cause a split-brain inconsistency.',
        level: 'MASTERED',
        score: 95,
        misconception: 'None. Clean conceptual grasp.',
        reTeachingStrategy: 'STEP_BY_STEP',
        reTeachingExplanation:
          'Spot on! You nailed the trade-off. Because you understand CP systems, let’s move to the next layer: How Paxos and Raft quorums allow a majority partition to keep working safely while the minority partition shuts down.',
        reTeachingQuestion:
          'If you have 5 nodes and 2 are disconnected, can the remaining 3 form a quorum in Raft?',
      },
      {
        label: 'Confused / Needs Simpler Explanation',
        studentReply:
          'I am completely lost. Why can’t we just buy faster fiber cables so there are never partitions?',
        level: 'NOT_UNDERSTOOD',
        score: 20,
        misconception: 'Believed physical hardware can completely eliminate physical failure states.',
        reTeachingStrategy: 'SIMPLE_EXPLANATION',
        reTeachingExplanation:
          'Don’t worry at all—this is where everyone starts! Here is the basic truth: Sharks bite undersea cables, power grids go out, and routers crash. No matter how much money you spend, network cuts are mathematically inevitable in the real world. So the CAP theorem simply asks: "When the cut happens, what should your software do?"',
        reTeachingQuestion:
          'Would you rather your banking app show a "Try again in 5 minutes" message, or accidentally show you have $0 in your balance?',
      },
    ],
  },
  {
    id: 'bio',
    subject: 'Molecular Biology',
    topicTitle: 'Cellular Energetics',
    conceptTitle: 'ATP Synthase & Proton Motive Force',
    sourceExcerpt:
      'The electron transport chain pumps protons (H+) from the mitochondrial matrix into the intermembrane space, creating an electrochemical gradient (proton motive force). ATP Synthase acts as a molecular turbine, utilizing the exergonic return flow of H+ to phosphorylate ADP into ATP.',
    lecturerExplanation:
      'Let us study ATP Synthase. Think of your mitochondrial inner membrane like a hydroelectric dam. As electrons move through complexes I-IV, protons are actively pumped uphill behind the dam. ATP Synthase is the water turbine.',
    checkQuestion:
      'If a toxin creates pores in the mitochondrial membrane that let protons leak freely back into the matrix, what happens to ATP synthesis and why?',
    studentOptions: [
      {
        label: 'Misconception (Believes electrons directly make ATP)',
        studentReply:
          'ATP will still be made at normal speed because electrons are still flowing through the chain.',
        level: 'PARTIALLY_UNDERSTOOD',
        score: 40,
        misconception: 'Believed electron flow directly synthesizes ATP without needing the proton gradient.',
        reTeachingStrategy: 'REAL_WORLD_ANALOGY',
        reTeachingExplanation:
          'Think of the hydroelectric dam again: If somebody drills 100 holes in the concrete wall of the dam, the water escapes without turning the turbine blades. Electron transport merely fills the reservoir behind the dam; the turbine (ATP synthase) only spins if the water is forced through its narrow channel. With leaks, the gradient collapses and turbine stops.',
        reTeachingQuestion:
          'What directly rotates the rotor of ATP Synthase: the electrons themselves, or the physical rush of protons?',
      },
      {
        label: 'Clear Mastery',
        studentReply:
          'ATP synthesis will halt or drop drastically because the proton motive force collapses. The protons bypass the ATP Synthase rotor, so ADP cannot be phosphorylated.',
        level: 'MASTERED',
        score: 98,
        misconception: 'None. Accurate chemiosmotic understanding.',
        reTeachingStrategy: 'ACADEMIC_DEEP_DIVE',
        reTeachingExplanation:
          'Precisely. This is the exact mechanism of uncouplers like 2,4-DNP. The energy is dissipated as pure heat rather than captured in high-energy phosphodiester bonds.',
        reTeachingQuestion:
          'What happens to the body temperature of an organism exposed to such an uncoupling agent?',
      },
    ],
  },
];

export const PedagogicalDemo: React.FC = () => {
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState(0);
  const [selectedReplyIndex, setSelectedReplyIndex] = useState<number | null>(0);
  const [activeStudentControl, setActiveStudentControl] = useState<string | null>(null);

  const currentScenario = SCENARIOS[selectedScenarioIndex];
  const activeReply = selectedReplyIndex !== null ? currentScenario.studentOptions[selectedReplyIndex] : null;

  return (
    <section id="pedagogical-loop" className="py-20 bg-slate-50 text-slate-900 border-t border-slate-200 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider mb-4">
            <Brain className="w-3.5 h-3.5" />
            <span>Interactive Pedagogical Engine Demo</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            See the AI Lecturer in Action
          </h2>
          <p className="text-base sm:text-lg text-slate-600 mt-3">
            Generic chatbots finish explaining and stop. CoreStack Learn checks your understanding, pinpoints your exact misconception, and shifts teaching strategy until you truly get it.
          </p>
        </div>

        {/* Subject Switcher Tabs */}
        <div className="flex justify-center gap-3 mb-8">
          {SCENARIOS.map((scenario, index) => (
            <button
              key={scenario.id}
              onClick={() => {
                setSelectedScenarioIndex(index);
                setSelectedReplyIndex(0);
              }}
              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                selectedScenarioIndex === index
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>{scenario.subject}: {scenario.topicTitle}</span>
            </button>
          ))}
        </div>

        {/* Live Simulator Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Source Material & Grounding */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 text-slate-700 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Uploaded Student Material</span>
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">Grounded Source</span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">{currentScenario.conceptTitle}</h3>
              <p className="text-xs text-slate-600 leading-relaxed italic bg-slate-50 p-3 rounded-lg border border-slate-200">
                "{currentScenario.sourceExcerpt}"
              </p>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>The AI lecturer teaches exclusively from this verified excerpt.</span>
                </p>
              </div>
            </div>

            {/* Student Action Controls Simulation */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5">
                Active Student Controls (In-Session)
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  'Explain More Simply',
                  'Give Me an Example',
                  'Explain Another Way',
                  'Go Deeper',
                  'I Don\'t Understand',
                  'Ask Me a Question',
                ].map((action) => (
                  <button
                    key={action}
                    onClick={() => setActiveStudentControl(action)}
                    className={`px-2.5 py-2 rounded-lg text-[11px] font-medium border text-left transition-all cursor-pointer ${
                      activeStudentControl === action
                        ? 'bg-blue-50 border-blue-400 text-blue-700 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900 hover:bg-white'
                    }`}
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Center & Right Column: Interactive Lecturer Conversation & Cognitive Diagnosis */}
          <div className="lg:col-span-8 space-y-4">
            <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-xl space-y-6">
              {/* Lecturer Header Bar */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-blue-600">
                    <Brain className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">AI Lecturer</p>
                    <p className="text-sm font-bold text-slate-900">Dr. CoreStack</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-green-50 text-green-700 text-[11px] font-bold rounded-full border border-green-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  ACTIVE SESSION
                </span>
              </div>

              {/* Step 1: AI Lecturer Explanation */}
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-sm">
                  AI
                </div>
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">Dr. CoreStack</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                      Step 1: Conversational Teaching
                    </span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl rounded-tl-none border border-slate-100 text-slate-700 text-sm leading-relaxed">
                    <p>{currentScenario.lecturerExplanation}</p>
                  </div>
                </div>
              </div>

              {/* Step 2: Understanding Check Question */}
              <div className="flex items-start gap-3.5 pl-4 border-l-2 border-blue-500/40">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 border border-blue-200">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-700">Understanding Check Question</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-100">
                      Mandatory Check
                    </span>
                  </div>
                  <div className="text-sm font-medium text-slate-900 bg-blue-50/50 p-3.5 rounded-xl border border-blue-100">
                    {currentScenario.checkQuestion}
                  </div>
                </div>
              </div>

              {/* Step 3: Interactive Student Response Selector */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Simulate Student Response</span>
                  <span className="text-[11px] text-slate-500 font-normal">Choose how the student replies:</span>
                </div>
                <div className="space-y-2">
                  {currentScenario.studentOptions.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedReplyIndex(idx)}
                      className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm transition-all flex items-start gap-3 cursor-pointer ${
                        selectedReplyIndex === idx
                          ? 'bg-white border-blue-600 text-slate-900 shadow-md ring-1 ring-blue-500/20'
                          : 'bg-white/80 border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                          selectedReplyIndex === idx ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                        }`}
                      >
                        {selectedReplyIndex === idx && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900 text-xs mb-1 flex items-center gap-2">
                          <span>{opt.label}</span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                              opt.level === 'MASTERED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : opt.level === 'PARTIALLY_UNDERSTOOD'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {opt.level}
                          </span>
                        </div>
                        <p className="text-slate-600 text-xs italic">"{opt.studentReply}"</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 4 & 5: Cognitive Evaluation Diagnosis & Adaptive Re-teaching */}
              {activeReply && (
                <div className="space-y-4 pt-2">
                  {/* Cognitive Diagnosis Card */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Brain className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                          Cognitive Engine Diagnosis
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-500 font-medium">Mastery Score:</span>
                        <span
                          className={`font-bold ${
                            activeReply.score >= 80 ? 'text-emerald-600' : activeReply.score >= 40 ? 'text-amber-600' : 'text-rose-600'
                          }`}
                        >
                          {activeReply.score}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          activeReply.score >= 80 ? 'bg-emerald-500' : activeReply.score >= 40 ? 'bg-blue-600' : 'bg-rose-500'
                        }`}
                        style={{ width: `${activeReply.score}%` }}
                      ></div>
                    </div>

                    <div className="text-xs text-slate-700 space-y-1.5 pt-1">
                      <p>
                        <strong className="text-slate-900">Diagnosed Misconception:</strong>{' '}
                        <span className="text-rose-700 font-medium">{activeReply.misconception}</span>
                      </p>
                      <p>
                        <strong className="text-slate-900">Selected Pedagogical Strategy:</strong>{' '}
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-[11px] border border-blue-100 font-semibold">
                          {activeReply.reTeachingStrategy}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Adaptive Re-Teaching Turn */}
                  <div className="flex items-start gap-3.5 pl-3 border-l-4 border-blue-500">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-sm">
                      <RotateCcw className="w-4 h-4" />
                    </div>
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-blue-700">Adaptive Re-Teaching Turn</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-100">
                          Strategy Shifted
                        </span>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-xl rounded-tl-none border border-slate-100 text-slate-700 text-sm leading-relaxed">
                        <p>{activeReply.reTeachingExplanation}</p>
                      </div>
                      <div className="p-3.5 rounded-lg bg-blue-50/60 border border-blue-100 text-xs text-slate-800">
                        <span className="font-bold text-blue-700">Follow-up Check: </span>
                        {activeReply.reTeachingQuestion}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
