/**
 * Material Analysis Service
 * Coordinates document parsing, chunking, and AI curricular analysis
 */

import { MaterialAnalysisResult } from './provider';
import { getAIProvider } from './teaching';

export async function analyzeStudyDocument(
  text: string,
  fileName: string
): Promise<MaterialAnalysisResult> {
  const provider = getAIProvider();
  return provider.analyzeMaterial(text, fileName);
}
