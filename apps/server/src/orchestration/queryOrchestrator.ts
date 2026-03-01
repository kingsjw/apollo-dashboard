/**
 * Query Orchestrator — coordinates the full AI query pipeline:
 *   1. Send natural-language prompt + schema + analysis to AI provider
 *   2. Validate the generated query against the schema
 *   3. If invalid, retry up to MAX_RETRIES times with correction context
 *   4. Execute the valid query via graphql()
 */

import type { AIProvider } from '../ai/provider.js';
import type { SchemaAnalysis } from '../schema/analyzer.js';
import { validateGeneratedQuery } from '../validation/validateQuery.js';
import { graphql } from 'graphql';
import type { GraphQLSchema } from 'graphql';
import type { AIQueryResponse, QueryStep } from '@apollo-dashboard/shared';

const MAX_RETRIES = 2;

export async function orchestrateQuery(
  provider: AIProvider,
  schema: GraphQLSchema,
  schemaSDL: string,
  schemaAnalysis: SchemaAnalysis,
  naturalLanguage: string,
): Promise<AIQueryResponse> {
  const steps: QueryStep[] = [];

  // -----------------------------------------------------------------------
  // Step 1-3: Generate, validate (with retries), and execute primary query
  // -----------------------------------------------------------------------
  const primaryStep = await generateAndExecute(
    provider,
    schema,
    schemaSDL,
    schemaAnalysis,
    naturalLanguage,
  );
  steps.push(primaryStep);

  return buildResponse(steps);
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Generate a query from natural language, validate with retries, and execute.
 */
async function generateAndExecute(
  provider: AIProvider,
  schema: GraphQLSchema,
  schemaSDL: string,
  schemaAnalysis: SchemaAnalysis,
  naturalLanguage: string,
): Promise<QueryStep> {
  let attempt = 0;
  let queryString = '';
  let lastErrors: string[] = [];

  while (attempt <= MAX_RETRIES) {
    queryString = await provider.generateQuery(
      naturalLanguage,
      schemaSDL,
      schemaAnalysis,
      lastErrors.length ? lastErrors : undefined,
    );

    // If the LLM returned natural language instead of a GraphQL query,
    // treat it as an out-of-scope explanation.
    if (queryString && !looksLikeGraphQL(queryString)) {
      return {
        query: '',
        validationStatus: 'out_of_scope',
        message: queryString,
        retryCount: 0,
      };
    }

    const { valid, errors } = validateGeneratedQuery(schema, queryString);

    if (valid) {
      const result = await executeQuery(schema, queryString);
      return {
        query: queryString,
        validationStatus: attempt > 0 ? 'corrected' : 'valid',
        result: result.data,
        error: result.error,
        retryCount: attempt,
      };
    }

    lastErrors = errors.map((e) => e.message);
    attempt++;
  }

  return {
    query: queryString,
    validationStatus: 'invalid',
    error: `Validation failed after ${MAX_RETRIES} retries: ${lastErrors.join(', ')}`,
    retryCount: MAX_RETRIES,
  };
}

// ---------------------------------------------------------------------------
// Query execution
// ---------------------------------------------------------------------------

interface ExecutionResult {
  data?: Record<string, unknown> | null;
  error?: string;
}

async function executeQuery(
  schema: GraphQLSchema,
  queryString: string,
): Promise<ExecutionResult> {
  const result = await graphql({ schema, source: queryString });
  return {
    data: result.data as Record<string, unknown> | undefined,
    error: result.errors?.[0]?.message,
  };
}

/**
 * Build the final AIQueryResponse from steps, preserving backward
 * compatibility by copying primary step fields to the top level.
 */
/**
 * Heuristic check: does the string look like a GraphQL query/mutation?
 * If it starts with '{', 'query', or 'mutation', it's likely GraphQL.
 * Otherwise it's probably a natural language explanation (out-of-scope).
 */
function looksLikeGraphQL(text: string): boolean {
  const trimmed = text.trimStart();
  return (
    trimmed.startsWith('{') ||
    trimmed.startsWith('query') ||
    trimmed.startsWith('mutation') ||
    trimmed.startsWith('subscription')
  );
}

function buildResponse(steps: QueryStep[]): AIQueryResponse {
  const primary = steps[0]!;
  return {
    steps,
    query: primary.query,
    validationStatus: primary.validationStatus,
    result: primary.result,
    error: primary.error,
    retryCount: primary.retryCount,
  };
}
