// Lecturer Voice Engine - Multi-Voice Pedagogical Speech Synthesis System

export interface LecturerVoicePersona {
  id: string;
  name: string;
  title: string;
  gender: 'male' | 'female' | 'neutral';
  accent: string;
  description: string;
  pitch: number; // 0.5 - 1.5
  rate: number; // 0.8 - 1.3
  preferredVoiceKeywords: string[];
  avatarBg: string;
  avatarColor: string;
  sampleQuote: string;
}

export const LECTURER_VOICE_PERSONAS: LecturerVoicePersona[] = [
  {
    id: 'dr_corestack',
    name: 'Dr. CoreStack',
    title: 'Distinguished Professor of Computing',
    gender: 'male',
    accent: 'US Academic',
    description: 'Deep, steady, authoritative tone ideal for systems and foundational invariants.',
    pitch: 0.92,
    rate: 0.98,
    preferredVoiceKeywords: ['Natural', 'David', 'Google US English', 'Alex', 'Daniel', 'Guy', 'en-US'],
    avatarBg: 'bg-blue-600',
    avatarColor: 'text-white',
    sampleQuote: 'Let us examine how invariants govern state transitions under strict causal ordering.',
  },
  {
    id: 'prof_vance',
    name: 'Prof. Eleanor Vance',
    title: 'Oxford Senior Academic Fellow',
    gender: 'female',
    accent: 'British Academic',
    description: 'Crisp, articulate, precise delivery perfect for formal proofs and nuanced concepts.',
    pitch: 1.05,
    rate: 1.0,
    preferredVoiceKeywords: ['Victoria', 'Google UK English Female', 'Serena', 'Sonia', 'Libby', 'en-GB'],
    avatarBg: 'bg-emerald-600',
    avatarColor: 'text-white',
    sampleQuote: 'Observe the subtle trade-off between consistency latency and availability guarantees.',
  },
  {
    id: 'dr_marcus_chen',
    name: 'Dr. Marcus Chen',
    title: 'Principal Systems Architect',
    gender: 'male',
    accent: 'Methodical & Calm',
    description: 'Clear, engineering-focused pacing suited for architecture and step-by-step algorithms.',
    pitch: 0.88,
    rate: 0.95,
    preferredVoiceKeywords: ['Google UK English Male', 'Oliver', 'Ryan', 'Arthur', 'en-GB', 'en-US'],
    avatarBg: 'bg-indigo-600',
    avatarColor: 'text-white',
    sampleQuote: 'Notice how the memory barriers prevent CPU instruction reordering at the hardware level.',
  },
  {
    id: 'sofia_al_mansoor',
    name: 'Sofia Al-Mansoor',
    title: 'Interactive Socratic Mentor',
    gender: 'female',
    accent: 'Warm & Engaging',
    description: 'Dynamic, encouraging, pedagogical cadence that stimulates curiosity and critical thinking.',
    pitch: 1.12,
    rate: 1.02,
    preferredVoiceKeywords: ['Samantha', 'Google US English', 'Karen', 'Zira', 'Moira', 'en-US', 'en-AU'],
    avatarBg: 'bg-amber-600',
    avatarColor: 'text-white',
    sampleQuote: 'Consider what would happen if a single node failed right before the acknowledgment!',
  },
  {
    id: 'dr_julian_thorne',
    name: 'Dr. Julian Thorne',
    title: 'Theoretical Research Director',
    gender: 'male',
    accent: 'Contemplative Scholarly',
    description: 'Measured, contemplative style suited for high-level synthesis and analogies.',
    pitch: 0.85,
    rate: 0.92,
    preferredVoiceKeywords: ['Fred', 'Daniel', 'Tom', 'George', 'en-US'],
    avatarBg: 'bg-purple-600',
    avatarColor: 'text-white',
    sampleQuote: 'Imagine this as an immutable ledger where each block anchors the cryptographic integrity.',
  },
];

/**
 * Strips raw Markdown characters (headers, bold, code blocks, bullet tokens)
 * so speech synthesis sounds natural and human.
 */
export function prepareTextForSpeech(markdown: string): string {
  if (!markdown) return '';

  return markdown
    // Remove code fences but keep description or simplify
    .replace(/```[\s\S]*?```/g, ' [Code segment omitted for audio narration] ')
    // Remove inline code ticks
    .replace(/`([^`]+)`/g, '$1')
    // Remove Markdown headers (#, ##, ###)
    .replace(/^#+\s+/gm, '')
    // Remove markdown links [text](url) -> text
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    // Remove bold and italic tokens
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Remove blockquote tokens
    .replace(/^>\s+/gm, '')
    // Replace bullet points with brief pauses
    .replace(/^[-*+]\s+/gm, 'Next point: ')
    // Replace numbered lists (1. , 2. ) with "Point 1", etc.
    .replace(/^(\d+)\.\s+/gm, 'Point $1: ')
    // Remove horizontal rules
    .replace(/^-{3,}$/gm, '')
    // Replace emoji or special non-spoken symbols
    .replace(/[🎯💡⚠️✓❌📌🚀🔍🧠📊]/g, '')
    // Clean up multiple linebreaks and spaces
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Finds the best available browser SpeechSynthesisVoice matching the persona
 */
export function findBestVoiceForPersona(
  availableVoices: SpeechSynthesisVoice[],
  persona: LecturerVoicePersona
): SpeechSynthesisVoice | null {
  if (!availableVoices || availableVoices.length === 0) return null;

  // 1. Try to match by preferred voice keywords
  for (const keyword of persona.preferredVoiceKeywords) {
    const match = availableVoices.find(
      (v) =>
        v.name.toLowerCase().includes(keyword.toLowerCase()) ||
        v.lang.toLowerCase().includes(keyword.toLowerCase())
    );
    if (match) return match;
  }

  // 2. Try to match by gender/language if possible
  const englishVoices = availableVoices.filter((v) => v.lang.startsWith('en'));
  if (englishVoices.length > 0) {
    if (persona.gender === 'female') {
      const femaleMatch = englishVoices.find((v) =>
        /female|woman|girl|samantha|victoria|karen|zira|serena|sonia|libby/i.test(v.name)
      );
      if (femaleMatch) return femaleMatch;
    } else {
      const maleMatch = englishVoices.find((v) =>
        /male|man|guy|david|alex|daniel|oliver|ryan|arthur|guy|george/i.test(v.name)
      );
      if (maleMatch) return maleMatch;
    }
    return englishVoices[0];
  }

  return availableVoices[0] || null;
}
