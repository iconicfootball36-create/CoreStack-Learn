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
        timeout: 20000,
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

  const matchingChunks = scored.filter((item) => item.score > 0).slice(0, 3);
  return matchingChunks.map((item) => item.chunk);
}

function isConversationalMessage(text: string): boolean {
  return /^(hi|hello|hey|good morning|good afternoon|good evening|how are you|how's it going|who\s+(are|re)\s+you|what are you|can we talk|can we do another topic|can we discuss another topic|let's talk about something else|i want to change topic|change the topic|can i ask|may i ask|i have a question|do you understand|are you there|i'?m doing|doing great|hope you are|thanks|thank you)\b/i.test(text.trim());
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
Your mission is to answer the student's questions naturally and accurately, like a helpful general-purpose AI assistant. When the question relates to the uploaded material, use it to give a grounded answer and help the student learn.

STUDENT PROFILE:
- Name: ${user.name}
- Academic Level: ${academicLevel} (Calibrate vocabulary, depth, and theoretical rigor accordingly)
- Learning Pace: ${learningPace}
- Uploaded Material Available: "${material.title}"
- Active Topic / Concept Focus: "${conceptName || 'General Course Scope'}"
- Requested Pedagogical Strategy: "${strategy}"

STRICT PEDAGOGICAL GROUNDING RULES:
1. Use the uploaded source chunks when they are relevant, but do not refuse general questions or claim that your expertise is limited to this material.
2. For questions outside the uploaded material, answer normally using your general knowledge. Be honest when you are uncertain.
3. If the user asks for a specific strategy:
   - "SIMPLE_EXPLANATION": Explain using first-principles intuition, clear everyday vocabulary, and zero superfluous jargon.
   - "REAL_WORLD_ANALOGY": Craft a vivid, memorable, mechanically accurate physical or real-world analogy.
   - "STEP_BY_STEP": Structure the explanation into sequentially numbered, logical execution phases with inputs, transitions, and outputs.
   - "QUESTION_LED": Do not just dump the answer. Ask an incisive question that leads the student to discover the principle themselves.
   - "ACADEMIC_DEEP_DIVE": Provide formal mathematical definitions, hardware/system trade-offs, edge cases, and algorithmic complexity.
   - "PRACTICAL_EXAMPLE": Provide a clear concrete numerical trace or pseudo-code scenario.
4. Only include a follow-up learning question when it helps; do not append one to casual conversation or ordinary direct questions.
5. Format your main response in clear, readable Markdown with bold terminology, bullet points, and code/formulas where relevant.`;

      const conversationGuidance = isConversationalMessage(studentInput)
        ? '\nThe student is making casual conversation. Respond warmly and naturally, like a normal AI assistant. Do not force a lesson, analogy, quiz, or course-material summary. Keep the reply concise and do not ask a diagnostic question.\n'
        : '';

      const formattedHistory = conversationHistory.slice(-6).map((h) => ({
        role: h.role === 'user' ? ('user' as const) : ('model' as const),
        parts: [{ text: h.text }],
      }));

      const currentTurnPrompt = `SOURCE DOCUMENT CHUNKS FROM UPLOADED MATERIAL:
${groundedContext}

STUDENT'S QUERY / RESPONSE:
"${studentInput}"

ACTIVE STRATEGY: ${strategy}

Respond with JSON adhering to the specified schema.${conversationGuidance}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
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

  if (isConversationalMessage(studentInput)) {
    const normalizedInput = studentInput.trim().toLowerCase();
    const reply = normalizedInput.startsWith('thank')
      ? 'You are welcome. What would you like to explore?'
      : normalizedInput.startsWith('how are you') || normalizedInput.startsWith("how's it going")
      ? 'I am doing well and ready to help. What would you like to talk about?'
      : normalizedInput.startsWith("i'm doing") || normalizedInput.startsWith('im doing') || normalizedInput.startsWith('doing great')
      ? 'That is good to hear. What would you like to explore?'
      : normalizedInput.startsWith('hope you are')
      ? 'I am doing well and ready to help. What would you like to explore?'
      : /^(who\s+(are|re)\s+you|what are you)/i.test(normalizedInput)
      ? 'I am Dr. CoreStack, your AI learning assistant. I can explain your uploaded material, answer general questions, and work through ideas with you step by step.'
      : normalizedInput.startsWith('can we talk')
      ? 'Of course. We can talk about anything you would like. What is on your mind?'
      : normalizedInput.startsWith('can we do another topic') || normalizedInput.startsWith('can we discuss another topic') || normalizedInput.startsWith("let's talk about something else") || normalizedInput.startsWith('i want to change topic') || normalizedInput.startsWith('change the topic')
      ? 'Of course. What topic would you like to explore next?'
      : normalizedInput.startsWith('do you understand')
      ? 'Yes, I understand you. You can ask me about your uploaded material or any other subject, and I will do my best to help.'
      : 'Of course. What would you like to talk about?';

    return {
      reply,
      strategyUsed: 'DEFAULT' as TeachingStrategy,
      pedagogicalIntent: 'Natural conversational response to the student.',
      groundedSources: [],
      followUpQuestion: '',
      suggestedActions: [],
      comprehensionScoreEstimate: 0,
    };
  }

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
      pedagogicalIntent = relevantChunks.length > 0
        ? 'Direct answer grounded in the uploaded material.'
        : 'Natural conversational response.';
      reply = relevantChunks.length > 0
        ? `Based on your uploaded material, **${targetTopic}** is described as follows:\n\n${primaryChunk.content}`
        : `I could not reach the live AI service just now, so I cannot give a reliable answer to that question yet. Please try again in a moment.`;
      followUpQuestion = relevantChunks.length > 0 ? `Would you like me to clarify any part of this answer?` : '';
      suggestedActions = relevantChunks.length > 0 ? suggestedActions : [];
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
