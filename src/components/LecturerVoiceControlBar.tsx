import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  Sparkles,
  Sliders,
  Check,
  ChevronDown,
  Activity,
  Mic,
  Headphones,
  UserCheck,
} from 'lucide-react';
import { UseLecturerVoiceReturn } from '../lib/useLecturerVoice';
import { LecturerVoicePersona } from '../lib/lecturerVoiceEngine';

interface LecturerVoiceControlBarProps {
  voiceEngine: UseLecturerVoiceReturn;
  onReadCurrentOrLast?: () => void;
}

export const LecturerVoiceControlBar: React.FC<LecturerVoiceControlBarProps> = ({
  voiceEngine,
  onReadCurrentOrLast,
}) => {
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const {
    personas,
    selectedPersona,
    setSelectedPersona,
    isSpeaking,
    isPaused,
    isSupported,
    speedRate,
    setSpeedRate,
    autoNarrate,
    setAutoNarrate,
    pause,
    resume,
    stop,
    testPersonaVoice,
  } = voiceEngine;

  if (!isSupported) {
    return null;
  }

  return (
    <>
      {/* Top Banner Control Strip */}
      <div className="px-4 py-2.5 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
        {/* Left: Persona info & selector trigger */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowVoiceModal(true)}
            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition-all cursor-pointer group text-left"
          >
            <div
              className={`w-7 h-7 rounded-lg ${selectedPersona.avatarBg} flex items-center justify-center font-bold text-xs text-white shadow-xs shrink-0`}
            >
              <Headphones className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                  {selectedPersona.name}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-white transition-colors" />
              </div>
              <span className="text-[10px] text-slate-400 block -mt-0.5">
                {selectedPersona.accent} • {selectedPersona.title.split(' ')[0]}
              </span>
            </div>
          </button>

          {/* Animated Waveform indicator when speaking */}
          {isSpeaking && !isPaused && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <span className="text-[11px] font-mono font-semibold">Narrating</span>
              <div className="flex items-end gap-0.5 h-3.5 ml-1">
                <div className="w-1 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s] h-3" />
                <div className="w-1 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s] h-2" />
                <div className="w-1 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.45s] h-3.5" />
                <div className="w-1 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.2s] h-1.5" />
              </div>
            </div>
          )}
        </div>

        {/* Right: Audio Playback & Voice Options Controls */}
        <div className="flex items-center gap-2">
          {/* Play/Pause/Stop Master Buttons */}
          {isSpeaking ? (
            <div className="flex items-center gap-1 bg-slate-800 rounded-xl p-1 border border-slate-700">
              {isPaused ? (
                <button
                  onClick={resume}
                  className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  title="Resume Narration"
                >
                  <Play className="w-3 h-3 fill-white" />
                  <span className="hidden sm:inline">Resume</span>
                </button>
              ) : (
                <button
                  onClick={pause}
                  className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  title="Pause Narration"
                >
                  <Pause className="w-3 h-3 fill-white" />
                  <span className="hidden sm:inline">Pause</span>
                </button>
              )}
              <button
                onClick={stop}
                className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Stop Narration"
              >
                <Square className="w-3 h-3 fill-current" />
              </button>
            </div>
          ) : (
            onReadCurrentOrLast && (
              <button
                onClick={onReadCurrentOrLast}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                title="Read out latest lecture explanation"
              >
                <Volume2 className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">Read Lecture Aloud</span>
              </button>
            )
          )}

          {/* Speed Selector (0.75x, 1x, 1.25x, 1.5x) */}
          <div className="flex items-center bg-slate-800 rounded-xl p-0.5 border border-slate-700 text-[11px] font-mono">
            {[0.8, 1.0, 1.25, 1.5].map((rate) => (
              <button
                key={rate}
                onClick={() => setSpeedRate(rate)}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer font-bold ${
                  speedRate === rate
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>

          {/* Auto Narrate Toggle Switch */}
          <button
            onClick={() => setAutoNarrate(!autoNarrate)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5 cursor-pointer ${
              autoNarrate
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title="Automatically read lecturer responses out loud"
          >
            <Mic className="w-3 h-3" />
            <span className="hidden md:inline">Auto-Narrate</span>
            <span
              className={`w-2 h-2 rounded-full ${autoNarrate ? 'bg-emerald-400' : 'bg-slate-600'}`}
            />
          </button>

          {/* Voice input preview */}
          <button
            type="button"
            disabled
            className="relative px-2.5 py-1.5 rounded-xl bg-slate-800/70 text-slate-500 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-not-allowed"
            title="Voice conversations are coming soon"
          >
            <Mic className="w-3 h-3" />
            <span className="hidden sm:inline">Talk to AI</span>
            <span className="absolute -top-2 -right-1 px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[8px] font-extrabold uppercase tracking-wide">
              Soon
            </span>
          </button>

          {/* Voice Selector button */}
          <button
            onClick={() => setShowVoiceModal(true)}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            title="Change Lecturer Voice Persona"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Voice Persona Selection Modal */}
      {showVoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-bold">
                  <Headphones className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Lecturer Voice Personas</h3>
                  <p className="text-[11px] text-slate-400">
                    Select a pedagogical voice with tailored cadence & academic tone
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowVoiceModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            {/* Persona Cards List */}
            <div className="p-4 space-y-2.5 max-h-[420px] overflow-y-auto">
              {personas.map((persona) => {
                const isSelected = selectedPersona.id === persona.id;
                return (
                  <div
                    key={persona.id}
                    className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-400 shadow-xs'
                        : 'bg-slate-50/50 hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div
                      onClick={() => setSelectedPersona(persona)}
                      className="flex items-start gap-3 cursor-pointer flex-1"
                    >
                      <div
                        className={`w-10 h-10 rounded-xl ${persona.avatarBg} flex items-center justify-center font-bold text-white shadow-xs shrink-0 mt-0.5`}
                      >
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900">{persona.name}</h4>
                          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                            {persona.accent}
                          </span>
                        </div>
                        <p className="text-[11px] text-blue-700 font-medium">{persona.title}</p>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                          {persona.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <button
                        onClick={() => testPersonaVoice(persona)}
                        className="px-2.5 py-1 rounded-lg bg-slate-200/80 hover:bg-slate-300 text-slate-800 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                        title="Preview sample sentence"
                      >
                        <Play className="w-2.5 h-2.5 fill-slate-800" />
                        <span>Sample</span>
                      </button>

                      {isSelected ? (
                        <span className="text-[10px] font-bold text-blue-600 flex items-center gap-0.5">
                          <Check className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedPersona(persona);
                            setShowVoiceModal(false);
                          }}
                          className="text-[10px] font-bold text-slate-500 hover:text-blue-600 cursor-pointer"
                        >
                          Select
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500 text-[11px]">
                Powered by High-Fidelity Speech Synthesis
              </span>
              <button
                onClick={() => setShowVoiceModal(false)}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all cursor-pointer shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
