/**
 * Gemini AI provider — stub for Phase 3.
 *
 * Will use @google/genai (NOT @google/generative-ai) to call
 * Gemini 1.5 Flash for query generation.
 */

import type { AIProvider, GenerateQueryRequest, GenerateQueryResult } from './provider.js';

export class GeminiProvider implements AIProvider {
  readonly name = 'Gemini 1.5 Flash';

  async generateQuery(_request: GenerateQueryRequest): Promise<GenerateQueryResult> {
    // TODO: Phase 3 — integrate with @google/genai
    throw new Error(
      'GeminiProvider.generateQuery is not yet implemented. Coming in Phase 3.',
    );
  }
}
