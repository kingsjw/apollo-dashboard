/**
 * AI Provider abstraction layer.
 *
 * This interface decouples the orchestration logic from any specific LLM
 * provider so that Gemini (or any future provider) can be swapped without
 * changing the rest of the codebase.
 */

import type { SchemaAnalysis } from '../schema/analyzer.js';

export interface AIProvider {
  /**
   * Generate a GraphQL query from a natural-language prompt.
   *
   * Implementations should inject the schema (both structured analysis and
   * raw SDL) into the LLM prompt and return only the raw GraphQL query
   * string (no markdown fences, etc.).
   *
   * @param naturalLanguage - The user's natural-language description.
   * @param schemaSDL - The GraphQL SDL string for reference.
   * @param schemaAnalysis - Structured schema analysis for graph-aware prompting.
   * @param previousErrors - Optional array of validation error messages from a prior attempt.
   */
  generateQuery(
    naturalLanguage: string,
    schemaSDL: string,
    schemaAnalysis: SchemaAnalysis,
    previousErrors?: string[],
  ): Promise<string>;
}
