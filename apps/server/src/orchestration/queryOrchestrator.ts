/**
 * Query Orchestrator — stub for Phase 3.
 *
 * Coordinates the generate -> validate -> (retry?) -> execute flow:
 *   1. Send natural-language prompt + schema to AI provider
 *   2. Validate the generated query against the schema
 *   3. If invalid, retry up to MAX_RETRIES times with correction context
 *   4. Execute the valid query via Apollo Server
 *   5. Return generated query + validation status + execution result
 */

import type { AIProvider } from '../ai/provider.js';
import type { GraphQLSchema } from 'graphql';

const MAX_RETRIES = 2;

export interface OrchestratorResult {
  /** The final generated GraphQL query string. */
  generatedQuery: string;
  /** Whether the query passed schema validation. */
  isValid: boolean;
  /** Validation errors, if any. */
  validationErrors: string[];
  /** Execution result data (null if query was invalid after retries). */
  data: unknown | null;
  /** Number of generation attempts (1 = first try succeeded). */
  attempts: number;
}

export interface QueryOrchestratorDeps {
  provider: AIProvider;
  schema: GraphQLSchema;
}

/**
 * Orchestrate a natural-language query through the full pipeline.
 *
 * Stub — will be implemented in Phase 3.
 */
export async function orchestrateQuery(
  _naturalLanguage: string,
  _deps: QueryOrchestratorDeps,
): Promise<OrchestratorResult> {
  // TODO: Phase 3 — implement generate -> validate -> retry -> execute flow
  void MAX_RETRIES; // acknowledge the constant to avoid lint warnings
  throw new Error('orchestrateQuery is not yet implemented. Coming in Phase 3.');
}
