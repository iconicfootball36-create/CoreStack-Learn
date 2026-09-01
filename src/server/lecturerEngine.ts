import { GoogleGenAI, Type } from '@google/genai';
import { StudyMaterial, DocumentChunk, User, TeachingStrategy, AcademicLevel } from '../types/database';
import { AuthStore } from './authStore';

let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

export interface LecturerMessage {
  sender: 'student' | 'lecturer' | 'system';
  text: string;
  strategy?: TeachingStrategy;
  groundedSources?: { heading: string; excerpt: string; chunkIndex: number }[];
  followUpQuestion?: string;
  suggestedActions?: string[];
  createdAt: string;
}

export interface LecturerRequest {
  user: User;
  material: StudyMaterial;
  chunks: DocumentChunk[];
  conceptName?: string;
  strategy?: TeachingStrategy;
  studentInput: string;
  conversationHistory: { role: 'user' | 'assistant'; text: string }[];
}

export interface LecturerResponse {
  reply: string;
  strategyUsed: TeachingStrategy;
  pedagogicalIntent: string;
  groundedSources: { heading: string; excerpt: string; chunkIndex: number }[];
  followUpQuestion: string;
  suggestedActions: string[];
  comprehensionScoreEstimate?: number; // 0 - 100
}

/**
 * Retrieve the most semantically relevant chunks for the student's query and active concept
 */
function retrieveRelevantChunks(chunks: DocumentChunk[], query: string, conceptName?: string): DocumentChunk[] {
  if (!chunks || chunks.length === 0) return [];
  if (chunks.length <= 4) return chunks;

  const searchTerms = `${query} ${conceptName || ''}`.toLowerCase().split(/\s+/).filter((t) => t.length > 2);

  const scored = chunks.map((chunk) => {
    let score = 0;
    const contentLower = chunk.content.toLowerCase();
    const headingLower = (chunk.heading || '').toLowerCase();

    // Check term occurrences
    for (const term of searchTerms) {
      if (headingLower.includes(term)) score += 5;
      if (contentLower.includes(term)) score += 2;
    }

    // Boost if chunk matches current concept name
    if (conceptName && headingLower.includes(conceptName.toLowerCase())) {
      score += 8;
    }

    return { chunk, score };
  });

  scored.sort((a, b) => b.score - a.score);

  // Return top 3 chunks (or at least the first 3 if none matched)
  return scored.slice(0, 3).map((s) => s.chunk);
}

/**
 * Core AI Personal Lecturer Engine (Dr. CoreStack)
 * Interacts with Gemini 3.7 Flash with strict academic grounding
 */
export async function generateLecturerResponse(req: LecturerRequest): Promise<LecturerResponse> {
  const { user, material, chunks, conceptName, strategy = 'REAL_WORLD_ANALOGY', studentInput, conversationHistory } = req;

  const relevantChunks = retrieveRelevantChunks(chunks, studentInput, conceptName);
  const groundedContext = relevantChunks
    .map((c, idx) => `[SOURCE CHUNK #${c.chunkIndex + 1}: ${c.heading}]\n${c.content}`)
    .join('\n\n---\n\n');

  const academicLevel = user.academicLevel || 'UNDERGRADUATE';
  const learningPace = user.learningPace || 'BALANCED';

  const ai = getGeminiClient();

  if (ai) {
    try {
      const systemInstruction = `You are "Dr. CoreStack", a world-class, empathetic, highly rigorous AI Academic Personal Lecturer.
Your mission is to guide the student to deep conceptual mastery using the provided lecture notes and textbook excerpts.

STUDENT PROFILE:
- Name: ${user.name}
- Academic Level: ${academicLevel} (Calibrate vocabulary, depth, and theoretical rigor accordingly)
- Learning Pace: ${learningPace}
- Current Course Material: "${material.title}"
- Active Topic / Concept Focus: "${conceptName || 'General Course Scope'}"
- Requested Pedagogical Strategy: "${strategy}"

STRICT PEDAGOGICAL GROUNDING RULES:
1. Ground your answer strictly in the provided Source Document Chunks. Never hallucinate facts outside the material.
2. If the user asks for a specific strategy:
   - "SIMPLE_EXPLANATION": Explain using first-principles intuition, clear everyday vocabulary, and zero superfluous jargon.
   - "REAL_WORLD_ANALOGY": Craft a vivid, memorable, mechanically accurate physical or real-world analogy.
   - "STEP_BY_STEP": Structure the explanation into sequentially numbered, logical execution phases with inputs, transitions, and outputs.
   - "QUESTION_LED": Do not just dump the answer. Ask an incisive question that leads the student to discover the principle themselves.
   - "ACADEMIC_DEEP_DIVE": Provide formal mathematical definitions, hardware/system trade-offs, edge cases, and algorithmic complexity.
   - "PRACTICAL_EXAMPLE": Provide a clear concrete numerical trace or pseudo-code scenario.
3. Always include 1 targeted follow-up formative question to verify the student's active comprehension.
4. Format your main response in elegant, readable Markdown with bold terminology, bullet points, and code/formulas where relevant.`;

      const formattedHistory = conversationHistory.slice(-6).map((h) => ({
        role: h.role === 'user' ? ('user' as const) : ('model' as const),
        parts: [{ text: h.text }],
      }));

      const currentTurnPrompt = `SOURCE DOCUMENT CHUNKS FROM UPLOADED MATERIAL:
${groundedContext}

STUDENT'S QUERY / RESPONSE:
"${studentInput}"

ACTIVE STRATEGY: ${strategy}

Respond with JSON adhering to the specified schema.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: [
          ...formattedHistory,
          {
            role: 'user',
            parts: [{ text: currentTurnPrompt }],
          },
        ],
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: {
                type: Type.STRING,
                description: 'The main lecturer explanation in markdown format.',
              },
              pedagogicalIntent: {
                type: Type.STRING,
                description: 'A 1-sentence explanation of why this teaching tactic was chosen.',
              },
              followUpQuestion: {
                type: Type.STRING,
                description: 'A concise question to test the student on what was just covered.',
              },
              suggestedActions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '3 short quick-reply buttons the student can click.',
              },
              comprehensionScoreEstimate: {
                type: Type.INTEGER,
                description: 'Estimated comprehension rating (0-100) based on student input.',
              },
            },
            required: ['reply', 'pedagogicalIntent', 'followUpQuestion', 'suggestedActions'],
          },
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        return {
          reply: parsed.reply,
          strategyUsed: strategy,
          pedagogicalIntent: parsed.pedagogicalIntent || 'Direct conceptual clarification.',
          groundedSources: relevantChunks.map((c) => ({
            heading: c.heading || 'Course Section',
            excerpt: c.content.slice(0, 160) + '...',
            chunkIndex: c.chunkIndex,
          })),
          followUpQuestion: parsed.followUpQuestion || 'Does this mechanical distinction make sense, or would you like to trace a concrete example?',
          suggestedActions: parsed.suggestedActions || ['Give me a practical example', 'Test my understanding', 'Step by step breakdown'],
          comprehensionScoreEstimate: parsed.comprehensionScoreEstimate || 80,
        };
      }
    } catch (err) {
      console.warn('Gemini lecturer generation error, engaging deterministic lecturer:', err);
    }
  }

  // Deterministic Fallback Lecturer
  return generateDeterministicLecturerResponse({
    user,
    material,
    relevantChunks,
    conceptName,
    strategy,
    studentInput,
  });
}

/**
 * Deterministic Pedagogical Lecturer Engine Fallback
 */
function generateDeterministicLecturerResponse(params: {
  user: User;
  material: StudyMaterial;
  relevantChunks: DocumentChunk[];
  conceptName?: string;
  strategy: TeachingStrategy;
  studentInput: string;
}): LecturerResponse {
  const { material, relevantChunks, conceptName, strategy, studentInput } = params;
  const primaryChunk = relevantChunks[0] || {
    heading: 'Core Concept',
    content: material.summary || 'Course study notes.',
    chunkIndex: 0,
  };

  const targetTopic = conceptName || primaryChunk.heading || material.title;

  let reply = '';
  let pedagogicalIntent = '';
  let followUpQuestion = '';
  let suggestedActions = ['Explain with an analogy', 'Break it down step-by-step', 'Give me a quiz question'];

  switch (strategy) {
    case 'SIMPLE_EXPLANATION':
      pedagogicalIntent = 'Deconstructed into first-principles intuition without heavy jargon.';
      reply = `Let's break down **${targetTopic}** in the simplest possible terms:\n\n` +
        `At its core, **${targetTopic}** is designed to solve a fundamental problem in the system: ensuring data availability and correctness without unnecessary overhead.\n\n` +
        `**Key Takeaway**: Rather than dealing with entire raw datasets at once, the system breaks operations down into modular units and caches what is needed immediately.\n\n` +
        `From your uploaded notes:\n> *"${primaryChunk.content.slice(0, 200)}..."*`;
      followUpQuestion = `If you had to summarize the main goal of ${targetTopic} in one sentence, what would you say?`;
      break;

    case 'REAL_WORLD_ANALOGY':
      pedagogicalIntent = 'Bridged abstract theoretical rules with an intuitive real-world physical model.';
      reply = `Think of **${targetTopic}** like an **organized research library desk**:\n\n` +
        `1. **The Desk (Fast Working Memory)**: The books you are actively reading right now sit open on your desk for instantaneous access.\n` +
        `2. **The Bookshelf (Main Storage)**: When you need a book not on your desk, you walk over to the shelf (a lookup delay), place it on your desk, and if the desk is full, you put your oldest unread book back on the shelf.\n\n` +
        `In ${material.title}, this exact mechanism prevents the system from stalling while ensuring fast access to critical information.`;
      followUpQuestion = `In this library analogy, what event would represent a "miss" or "fault"?`;
      break;

    case 'STEP_BY_STEP':
      pedagogicalIntent = 'Sequential timeline breakdown of system state transitions.';
      reply = `Here is the exact step-by-step execution pipeline for **${targetTopic}**:\n\n` +
        `1. **Trigger & Request**: The CPU or system issues an address/request for a specific resource.\n` +
        `2. **Lookup & Cache Check**: The system inspects the fast translation table to see if the record is currently valid in memory.\n` +
        `3. **Fault Trapping (If absent)**: If not present, a hardware interrupt halts execution and transfers control to the operating handler.\n` +
        `4. **Resolution & Fetch**: The missing block is read from non-volatile storage into an available physical slot.\n` +
        `5. **Resume & Execution**: The mapping is updated and the original instruction resumes seamlessly.`;
      followUpQuestion = `What critical step happens between step 3 (trap) and step 4 (fetch) if all physical slots are already occupied?`;
      break;

    case 'QUESTION_LED':
      pedagogicalIntent = 'Socratic probe to stimulate deductive reasoning and baseline discovery.';
      reply = `Let's test our core intuition about **${targetTopic}**.\n\n` +
        `Consider what happens when multiple concurrent processes request more resources than physically exist in hardware at that moment.\n\n` +
        `Based on your notes in *${primaryChunk.heading}*, how should the system decide which operation gets priority, and what trade-off must be made?`;
      followUpQuestion = `What penalty does the system pay if it makes the wrong eviction decision repeatedly?`;
      break;

    case 'ACADEMIC_DEEP_DIVE':
      pedagogicalIntent = 'Formal algorithmic analysis with invariants and performance bounds.';
      reply = `### Academic Deep Dive: ${targetTopic}\n\n` +
        `**Formal Definition & Guarantees**:\n` +
        `In formal terms, ${targetTopic} establishes a strict invariant between logical references and physical mappings.\n\n` +
        `**Source Grounding (${primaryChunk.heading})**:\n` +
        `\`\`\`text\n${primaryChunk.content}\n\`\`\`\n\n` +
        `**Complexity & Invariants**:\n` +
        `- **Lookup Latency**: $O(1)$ amortized under hardware-assisted associative caching.\n` +
        `- **Worst-Case Cost**: Proportional to disk I/O seek latency during page evictions.\n` +
        `- **Safety Invariant**: Strict isolation between concurrent address spaces.`;
      followUpQuestion = `How does associative tag matching in hardware maintain $O(1)$ lookup time compared to an in-memory sequential table?`;
      break;

    default:
      pedagogicalIntent = 'Comprehensive grounded lesson overview tailored to student academic level.';
      reply = `Welcome to our session on **${targetTopic}** from "*${material.title}*".\n\n` +
        `${primaryChunk.content}\n\n` +
        `We can explore this concept from multiple angles: we can trace its internal mechanics step-by-step, use real-world analogies, or test your comprehension with a quick diagnostic question.`;
      followUpQuestion = `Which aspect of ${targetTopic} would you like to explore first?`;
      break;
  }

  return {
    reply,
    strategyUsed: strategy,
    pedagogicalIntent,
    groundedSources: relevantChunks.map((c) => ({
      heading: c.heading || 'Course Section',
      excerpt: c.content.slice(0, 160) + '...',
      chunkIndex: c.chunkIndex,
    })),
    followUpQuestion,
    suggestedActions,
    comprehensionScoreEstimate: 85,
  };
}
