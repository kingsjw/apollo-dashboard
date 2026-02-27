/**
 * AI Provider abstraction layer.
 *
 * This interface decouples the orchestration logic from any specific LLM
 * provider so that Gemini (or any future provider) can be swapped without
 * changing the rest of the codebase.
 */

export interface GenerateQueryRequest {
  /** The user's natural-language description of the desired query. */
  naturalLanguage: string;
  /** The GraphQL SDL schema string to inform the model. */
  schema: string;
  /** Optional previous attempt and errors for retry / correction prompts. */
  previousAttempt?: {
    query: string;
    errors: string[];
  };
}

export interface GenerateQueryResult {
  /** The generated GraphQL query string. */
  query: string;
  /** The provider that generated the query (e.g. "gemini"). */
  provider: string;
}

export interface AIProvider {
  /** Human-readable name of the provider (e.g. "Gemini 1.5 Flash"). */
  readonly name: string;

  /**
   * Generate a GraphQL query from a natural-language prompt.
   * Implementations should inject the schema into the LLM prompt and return
   * only the raw GraphQL query string (no markdown fences, etc.).
   */
  generateQuery(request: GenerateQueryRequest): Promise<GenerateQueryResult>;
}
