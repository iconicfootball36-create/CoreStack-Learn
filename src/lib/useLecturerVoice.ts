import { useState, useEffect, useRef, useCallback } from 'react';
import {
  LecturerVoicePersona,
  LECTURER_VOICE_PERSONAS,
  prepareTextForSpeech,
  findBestVoiceForPersona,
} from './lecturerVoiceEngine';

export interface UseLecturerVoiceReturn {
  personas: LecturerVoicePersona[];
  selectedPersona: LecturerVoicePersona;
  setSelectedPersona: (persona: LecturerVoicePersona) => void;
  isSpeaking: boolean;
  isPaused: boolean;
  isSupported: boolean;
  activeMessageId: string | null;
  speedRate: number;
  setSpeedRate: (rate: number) => void;
  autoNarrate: boolean;
  setAutoNarrate: (enabled: boolean) => void;
  speakText: (text: string, messageId?: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  testPersonaVoice: (persona: LecturerVoicePersona) => void;
}

export function useLecturerVoice(): UseLecturerVoiceReturn {
  const [personas] = useState<LecturerVoicePersona[]>(LECTURER_VOICE_PERSONAS);
  const [selectedPersona, setSelectedPersonaState] = useState<LecturerVoicePersona>(() => {
    const saved = localStorage.getItem('csl_lecturer_voice');
    if (saved) {
      const found = LECTURER_VOICE_PERSONAS.find((p) => p.id === saved);
      if (found) return found;
    }
    return LECTURER_VOICE_PERSONAS[0];
  });

  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [speedRate, setSpeedRate] = useState<number>(1.0);
  const [autoNarrate, setAutoNarrateState] = useState<boolean>(() => {
    return localStorage.getItem('csl_auto_narrate') === 'true';
  });

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load available system voices
  useEffect(() => {
    if (!isSupported) return;

    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices);
      }
    };

    updateVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }

    return () => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSupported]);

  const setSelectedPersona = (persona: LecturerVoicePersona) => {
    setSelectedPersonaState(persona);
    localStorage.setItem('csl_lecturer_voice', persona.id);
  };

  const setAutoNarrate = (enabled: boolean) => {
    setAutoNarrateState(enabled);
    localStorage.setItem('csl_auto_narrate', String(enabled));
  };

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    setActiveMessageId(null);
    currentUtteranceRef.current = null;
  }, [isSupported]);

  const pause = useCallback(() => {
    if (!isSupported) return;
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, [isSupported]);

  const resume = useCallback(() => {
    if (!isSupported) return;
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, [isSupported]);

  const speakText = useCallback(
    (text: string, messageId?: string) => {
      if (!isSupported || !text) return;

      // Stop any current utterance first
      window.speechSynthesis.cancel();

      const cleanedText = prepareTextForSpeech(text);
      if (!cleanedText) return;

      const utterance = new SpeechSynthesisUtterance(cleanedText);
      currentUtteranceRef.current = utterance;

      // Find matching voice
      const matchedVoice = findBestVoiceForPersona(availableVoices, selectedPersona);
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      // Configure Pitch & Speed
      utterance.pitch = selectedPersona.pitch;
      utterance.rate = selectedPersona.rate * speedRate;
      utterance.volume = 1.0;

      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
        if (messageId) setActiveMessageId(messageId);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        setActiveMessageId(null);
        currentUtteranceRef.current = null;
      };

      utterance.onerror = (e) => {
        console.warn('Speech synthesis utterance error:', e);
        setIsSpeaking(false);
        setIsPaused(false);
        setActiveMessageId(null);
        currentUtteranceRef.current = null;
      };

      window.speechSynthesis.speak(utterance);
    },
    [isSupported, availableVoices, selectedPersona, speedRate]
  );

  const testPersonaVoice = useCallback(
    (persona: LecturerVoicePersona) => {
      if (!isSupported) return;

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(persona.sampleQuote);
      const matchedVoice = findBestVoiceForPersona(availableVoices, persona);
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }
      utterance.pitch = persona.pitch;
      utterance.rate = persona.rate * speedRate;

      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
        setActiveMessageId('test_voice_' + persona.id);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        setActiveMessageId(null);
      };

      window.speechSynthesis.speak(utterance);
    },
    [isSupported, availableVoices, speedRate]
  );

  return {
    personas,
    selectedPersona,
    setSelectedPersona,
    isSpeaking,
    isPaused,
    isSupported,
    activeMessageId,
    speedRate,
    setSpeedRate,
    autoNarrate,
    setAutoNarrate,
    speakText,
    pause,
    resume,
    stop,
    testPersonaVoice,
  };
}
