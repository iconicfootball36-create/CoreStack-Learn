import crypto from 'crypto';
import { GoogleGenAI, Type } from '@google/genai';
import { StudyMaterial, DocumentChunk, Course, Topic, Concept } from '../types/database';

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

/**
 * Text Cleaning and Normalization
 */
export function cleanAndNormalizeText(rawText: string): string {
  if (!rawText) return '';

  return (
    rawText
      // Standardize carriage returns
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Remove repetitive page number / footer artifacts (e.g., "Page 12 of 45", "--- Page 3 ---")
      .replace(/(?:Page\s+\d+(?:\s+of\s+\d+)?|---\s*Page\s+\d+\s*---)/gi, '')
      // Normalize excessive horizontal whitespace
      .replace(/[ \t]+/g, ' ')
      // Normalize excessive linebreaks (keep max 2 newlines)
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}

/**
 * Approximate token count (~4 characters per token in English)
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Semantic Document Chunking
 * Splits on heading and paragraph boundaries rather than arbitrary byte boundaries.
 */
export function semanticChunkDocument(
  materialId: string,
  fullText: string,
  options: { maxTokens?: number; minTokens?: number } = {}
): DocumentChunk[] {
  const maxTokens = options.maxTokens || 450;
  const minTokens = options.minTokens || 80;

  const cleaned = cleanAndNormalizeText(fullText);
  if (!cleaned) return [];

  // Split into raw sections based on Markdown headers or double newlines
  const rawParagraphs = cleaned.split(/\n\n+/);
  const chunks: DocumentChunk[] = [];

  let currentHeading = 'Overview';
  let currentSection = 'Introduction';
  let currentAccumulated = '';
  let chunkIndex = 0;

  for (let i = 0; i < rawParagraphs.length; i++) {
    const paragraph = rawParagraphs[i].trim();
    if (!paragraph) continue;

    // Check if this paragraph is a Markdown heading or Section indicator
    const headingMatch = paragraph.match(/^(#{1,4}|Section\s+\d+:?|Chapter\s+\d+:?|Topic:?)\s*(.+)/i);
    if (headingMatch) {
      // If we have accumulated text, flush the previous chunk before switching heading
      if (currentAccumulated.trim()) {
        const tokenCount = estimateTokens(currentAccumulated);
        chunks.push({
          id: `chk_${materialId.slice(-6)}_${chunkIndex++}`,
          materialId,
          chunkIndex: chunks.length,
          content: currentAccumulated.trim(),
          tokenCount,
          heading: currentHeading,
          section: currentSection,
          createdAt: new Date().toISOString(),
        });
        currentAccumulated = '';
      }

      currentHeading = headingMatch[2].replace(/[#*`]/g, '').trim();
      currentSection = currentHeading;
      currentAccumulated = `${paragraph}\n\n`;
      continue;
    }

    const prospective = currentAccumulated ? `${currentAccumulated}\n\n${paragraph}` : paragraph;
    const prospectiveTokens = estimateTokens(prospective);

    if (prospectiveTokens > maxTokens && currentAccumulated.trim().length > 0) {
      // Flush current chunk
      const tokenCount = estimateTokens(currentAccumulated);
      chunks.push({
        id: `chk_${materialId.slice(-6)}_${chunkIndex++}`,
        materialId,
        chunkIndex: chunks.length,
        content: currentAccumulated.trim(),
        tokenCount,
        heading: currentHeading,
        section: currentSection,
        createdAt: new Date().toISOString(),
      });

      // Start new chunk with current paragraph
      currentAccumulated = paragraph;
    } else {
      currentAccumulated = prospective;
    }
  }

  // Flush any remainder
  if (currentAccumulated.trim()) {
    const tokenCount = estimateTokens(currentAccumulated);
    chunks.push({
      id: `chk_${materialId.slice(-6)}_${chunkIndex++}`,
      materialId,
      chunkIndex: chunks.length,
      content: currentAccumulated.trim(),
      tokenCount,
      heading: currentHeading,
      section: currentSection,
      createdAt: new Date().toISOString(),
    });
  }

  return chunks;
}

/**
 * Intelligent Curriculum & Concept Graph Extraction
 * Uses Gemini 3.7 Flash if API key is present, otherwise falls back to a deterministic semantic parser.
 */
export async function generateCourseCurriculum(
  material: StudyMaterial,
  chunks: DocumentChunk[]
): Promise<{ course: Course; topics: Topic[]; concepts: Concept[] }> {
  const courseId = `crs_${crypto.randomBytes(8).toString('hex')}`;
  const ai = getGeminiClient();

  // If Gemini API is available, generate structured curriculum via LLM
  if (ai) {
    try {
      // Sample representative content up to 8000 characters
      const sampleContent = chunks
        .map((c) => `[SECTION: ${c.heading}]\n${c.content}`)
        .join('\n\n')
        .slice(0, 10000);

      const prompt = `You are a Senior Academic Curriculum Architect. Analyze the following uploaded study material and transform it into a structured, highly pedagogical learning plan for a student.

MATERIAL TITLE: "${material.title}"
FILENAME: "${material.originalFileName}"

CONTENT SAMPLE:
${sampleContent}

Generate a structured curriculum in JSON format with:
1. Course metadata: title, subject domain, high-level summary.
2. 2-4 ordered Topics.
3. For each Topic, 2-4 atomic Concepts. Each concept must have:
   - title: concise concept name
   - definition: rigorous 1-2 sentence core definition
   - keyPoints: 3 key bullet points or rules
   - difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
   - estimatedMinutes: study time in minutes
   - orderIndex: sequence number`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              courseTitle: { type: Type.STRING },
              subject: { type: Type.STRING },
              description: { type: Type.STRING },
              topics: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    estimatedMinutes: { type: Type.INTEGER },
                    concepts: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          title: { type: Type.STRING },
                          definition: { type: Type.STRING },
                          keyPoints: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                          },
                          difficulty: { type: Type.STRING },
                        },
                        required: ['title', 'definition', 'keyPoints', 'difficulty'],
                      },
                    },
                  },
                  required: ['title', 'description', 'concepts'],
                },
              },
            },
            required: ['courseTitle', 'subject', 'description', 'topics'],
          },
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);

        const course: Course = {
          id: courseId,
          userId: material.userId,
          materialId: material.id,
          title: parsed.courseTitle || material.title,
          description: parsed.description || material.summary || 'Structured interactive course curriculum.',
          subject: parsed.subject || 'Academic Studies',
          recommendedOrder: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const topics: Topic[] = [];
        const allConcepts: Concept[] = [];

        (parsed.topics || []).forEach((t: any, tIdx: number) => {
          const topicId = `top_${crypto.randomBytes(6).toString('hex')}`;
          const topicConcepts: Concept[] = [];

          (t.concepts || []).forEach((c: any, cIdx: number) => {
            const conceptId = `c_${crypto.randomBytes(6).toString('hex')}`;
            const diff = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].includes(c.difficulty)
              ? (c.difficulty as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED')
              : 'INTERMEDIATE';

            const concept: Concept = {
              id: conceptId,
              topicId,
              title: c.title,
              definition: c.definition,
              keyPoints: c.keyPoints || [],
              orderIndex: cIdx + 1,
              difficulty: diff,
            };
            topicConcepts.push(concept);
            allConcepts.push(concept);
          });

          topics.push({
            id: topicId,
            courseId,
            title: t.title,
            description: t.description,
            orderIndex: tIdx + 1,
            estimatedMinutes: t.estimatedMinutes || 25,
            concepts: topicConcepts,
          });
        });

        course.topics = topics;
        return { course, topics, concepts: allConcepts };
      }
    } catch (err) {
      console.warn('Gemini curriculum generation failed, using deterministic extractor:', err);
    }
  }

  // Fallback Deterministic Curriculum Extractor based on document chunk headings
  return generateDeterministicCurriculum(material, chunks, courseId);
}

/**
 * Deterministic Semantic Curriculum Fallback
 */
function generateDeterministicCurriculum(
  material: StudyMaterial,
  chunks: DocumentChunk[],
  courseId: string
): { course: Course; topics: Topic[]; concepts: Concept[] } {
  const course: Course = {
    id: courseId,
    userId: material.userId,
    materialId: material.id,
    title: material.title,
    description: material.summary || `Comprehensive learning module for ${material.title}.`,
    subject: 'Computer Science & Engineering',
    recommendedOrder: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Group chunks by heading
  const headingMap = new Map<string, DocumentChunk[]>();
  for (const chunk of chunks) {
    const h = chunk.heading || 'Core Fundamentals';
    if (!headingMap.has(h)) {
      headingMap.set(h, []);
    }
    headingMap.get(h)!.push(chunk);
  }

  const topics: Topic[] = [];
  const allConcepts: Concept[] = [];
  let topicIndex = 1;

  for (const [heading, chunkList] of headingMap.entries()) {
    const topicId = `top_${crypto.randomBytes(6).toString('hex')}`;
    const topicConcepts: Concept[] = [];

    // Create 1-2 concepts per heading from chunk contents
    chunkList.slice(0, 3).forEach((chunk, cIdx) => {
      const conceptId = `c_${crypto.randomBytes(6).toString('hex')}`;
      const firstSentence = chunk.content.split(/[.!?]\s+/)[0] || `${heading} Core Principle`;

      const concept: Concept = {
        id: conceptId,
        topicId,
        title: `${heading} — Part ${cIdx + 1}`,
        definition: firstSentence.slice(0, 180) + '.',
        keyPoints: [
          `Key concept grounded in source section "${chunk.heading}".`,
          `Token density: ~${chunk.tokenCount} tokens of core reference material.`,
          `Mastery requires demonstrating understanding without notes.`,
        ],
        orderIndex: cIdx + 1,
        difficulty: cIdx === 0 ? 'BEGINNER' : cIdx === 1 ? 'INTERMEDIATE' : 'ADVANCED',
      };

      topicConcepts.push(concept);
      allConcepts.push(concept);
    });

    topics.push({
      id: topicId,
      courseId,
      title: heading,
      description: `In-depth analysis and verification for ${heading}.`,
      orderIndex: topicIndex++,
      estimatedMinutes: 20 + chunkList.length * 5,
      concepts: topicConcepts,
    });
  }

  course.topics = topics;
  return { course, topics, concepts: allConcepts };
}

/**
 * Curated Academic Benchmark Packs for Instant Learning
 */
export const CURATED_ACADEMIC_PACKS = [
  {
    id: 'pack_os_vm',
    title: 'Operating Systems — Virtual Memory & Paging Mechanics',
    originalFileName: 'MIT_6.004_OS_VirtualMemory_Paging.pdf',
    fileType: 'pdf' as const,
    fileSize: 2840000,
    summary: 'Demand paging, Translation Lookaside Buffer (TLB), Page Fault trap pipeline, FIFO vs LRU page replacement, and thrashing mechanics.',
    content: `# Chapter 7: Virtual Memory Architecture

## 1. Virtual Memory & Address Spaces
Virtual memory is a memory management capability of an operating system that uses hardware and software to allow a computer to compensate for physical memory shortages by temporarily transferring data from random access memory (RAM) to disk storage.
Each running process is allocated its own contiguous virtual address space, isolating it from other processes and ensuring robust memory protection.

## 2. Paging and Translation Lookaside Buffer (TLB)
The CPU generates Virtual Addresses (VA) composed of a Virtual Page Number (VPN) and an offset. The Memory Management Unit (MMU) translates the VPN into a Physical Frame Number (PFN) using the Page Table.
Because accessing the Page Table in main memory adds latency, the MMU utilizes a Translation Lookaside Buffer (TLB)—a fast, fully associative hardware cache that stores recent address translations. A TLB hit enables translation in a single clock cycle.

## 3. Page Faults and Interrupt Handling
When a process references a page whose valid bit in the page table is 0, the MMU raises a hardware interrupt known as a Page Fault.
The OS kernel takes control:
1. Traps into kernel mode.
2. Checks if the virtual address is valid within the process's address space.
3. Locates a free physical frame (or selects a victim frame via page replacement).
4. Initiates asynchronous disk I/O to read the page into the physical frame.
5. Updates the Page Table and valid bit.
6. Restarts the faulting CPU instruction seamlessly.

## 4. Page Replacement Algorithms: FIFO, LRU, and Clock
When physical memory is full, the OS must choose a victim page to evict:
- **FIFO (First-In, First-Out)**: Evicts the oldest page. Suffers from Belady's Anomaly (increasing memory frames can increase page faults).
- **LRU (Least Recently Used)**: Evicts the page that has not been accessed for the longest time. Highly effective but expensive in pure hardware.
- **Clock Algorithm (Second Chance)**: Practical approximation of LRU using a single reference bit per frame with a revolving clock pointer.

## 5. Thrashing and the Working Set Model
Thrashing occurs when a computer's virtual memory subsystem is in a constant state of paging—rapidly exchanging data between memory and disk storage—so that little actual computation takes place.
The Working Set Model resolves thrashing by defining the working set W(t, delta) as the set of pages referenced by a process in the last delta time units. If the total working set demand of all active processes exceeds available physical frames, the OS must suspend a process to avoid system collapse.`,
  },
  {
    id: 'pack_db_acid',
    title: 'Database Internals — ACID Transactions & Distributed Consensus',
    originalFileName: 'Stanford_CS245_Transactions_ACID_2PL.pdf',
    fileType: 'pdf' as const,
    fileSize: 3120000,
    summary: 'Atomicity, Consistency, Isolation, Durability, Two-Phase Locking (2PL), Write-Ahead Logging (WAL), and Multi-Version Concurrency Control (MVCC).',
    content: `# Module 4: Database Transactions & Concurrency

## 1. The ACID Guarantees
In database systems, a transaction is an atomic sequence of database actions (reads and writes). The ACID properties guarantee data integrity:
- **Atomicity**: Either all operations in the transaction succeed, or none are reflected. Implemented via Undo logging and abort rollbacks.
- **Consistency**: A transaction transforms the database from one valid state to another, preserving all integrity constraints.
- **Isolation**: Concurrent execution of transactions yields the same result as serial execution.
- **Durability**: Once a transaction commits, its changes survive system crashes and power failures.

## 2. Write-Ahead Logging (WAL) & ARIES Recovery
The fundamental principle of Write-Ahead Logging (WAL) states:
1. Any undo log record must be flushed to non-volatile disk before the corresponding dirty data page is written to disk (Steal policy).
2. All log records for a committed transaction must be forced to disk before the commit returns to the client (No-Force policy).
The ARIES recovery algorithm operates in three phases during crash recovery: Analysis (determines dirty pages), Redo (repeats history to reconstruct state), and Undo (rolls back uncommitted transactions).

## 3. Strict Two-Phase Locking (Strict 2PL)
Strict 2PL guarantees serializable isolation and prevents cascading aborts by enforcing two rules:
- **Phase 1 (Growing)**: A transaction acquires shared (S) locks for reads and exclusive (X) locks for writes. No locks can be released while in the growing phase.
- **Phase 2 (Shrinking)**: All locks are held until the very end of the transaction (Commit or Abort).

## 4. Multi-Version Concurrency Control (MVCC)
In MVCC, readers never block writers, and writers never block readers.
Each write creates a new version of the row tagged with a transaction timestamp. Readers see a consistent snapshot of the database corresponding to their start timestamp, eliminating read locks entirely while maintaining Snapshot Isolation.`,
  },
  {
    id: 'pack_dl_transformers',
    title: 'Deep Learning — Attention Mechanism & Transformer Architectures',
    originalFileName: 'Attention_Is_All_You_Need_DeepDive.pdf',
    fileType: 'pdf' as const,
    fileSize: 2420000,
    summary: 'Self-Attention mechanics, Query-Key-Value vector math, Multi-Head Attention, Positional Encoding, and Residual LayerNorm blocks.',
    content: `# Deep Learning: Transformers & Self-Attention

## 1. The Limits of RNNs and the Emergence of Attention
Recurrent Neural Networks (RNNs and LSTMs) process sequence tokens sequentially, which hinders parallel training on GPUs and leads to vanishing gradient issues over long sequence distances.
The Attention Mechanism bypasses recurrence by allowing any token in a sequence to attend directly to every other token with constant computational depth O(1).

## 2. Scaled Dot-Product Attention: Query, Key, and Value
For an input matrix of embeddings X, linear projections produce three matrices:
- **Queries (Q)**: What the current token is seeking.
- **Keys (K)**: What each token represents.
- **Values (V)**: The actual semantic content passed forward.

The scaled dot-product attention formula is:
$$Attention(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right) V$$
Dividing by the square root of d_k prevents dot products from growing excessively large in high dimensions, which would cause softmax gradients to vanish.

## 3. Multi-Head Attention (MHA)
Rather than performing a single attention function with d_model-dimensional queries, keys, and values, Multi-Head Attention linearly projects queries, keys, and values h times with different learned linear projections to dimensions d_k, d_k, and d_v.
This enables the model to jointly attend to information from different representation subspaces at different positions (e.g., one head for syntax, one head for semantic coreference).

## 4. Positional Encodings & Layer Normalization
Because the transformer architecture contains no recurrence or convolution, it has no inherent notion of token order. To inject positional information, positional encodings (sinusoidal frequencies or learned position embeddings) are added directly to the input embeddings.
Each sub-layer (Self-Attention and Feed-Forward) employs a residual connection followed by Layer Normalization:
$$\\text{Output} = \\text{LayerNorm}(x + \\text{Sublayer}(x))$$`,
  },
];
