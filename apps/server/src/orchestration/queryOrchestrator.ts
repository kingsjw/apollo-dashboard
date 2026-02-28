/**
 * Query Orchestrator — coordinates the full AI query pipeline:
 *   1. Send natural-language prompt + schema + analysis to AI provider
 *   2. Validate the generated query against the schema
 *   3. If invalid, retry up to MAX_RETRIES times with correction context
 *   4. Execute the valid query via graphql()
 *   5. Ask the LLM if a follow-up query would be useful
 *   6. If yes, validate and execute the follow-up (max 1 follow-up)
 *   7. Return all steps in the response
 */

import type { AIProvider } from '../ai/provider.js';
import type { SchemaAnalysis } from '../schema/analyzer.js';
import { validateGeneratedQuery } from '../validation/validateQuery.js';
import { graphql } from 'graphql';
import type { GraphQLSchema } from 'graphql';
import type { AIQueryResponse, QueryStep } from '@apollo-dashboard/shared';

const MAX_RETRIES = 2;

/** Timeout for proxied query execution against external endpoints (15 s). */
const EXTERNAL_EXEC_TIMEOUT_MS = 15_000;

export interface OrchestrateOptions {
  /** If set, execute queries via HTTP POST to this URL instead of local graphql(). */
  executeEndpoint?: string;
  /** Optional headers sent with proxied requests to the external endpoint. */
  executeHeaders?: Record<string, string>;
}

export async function orchestrateQuery(
  provider: AIProvider,
  schema: GraphQLSchema,
  schemaSDL: string,
  schemaAnalysis: SchemaAnalysis,
  naturalLanguage: string,
  options?: OrchestrateOptions,
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
    options,
  );
  steps.push(primaryStep);

  // If the primary query failed validation, return early — no follow-up.
  if (primaryStep.validationStatus === 'invalid') {
    return buildResponse(steps);
  }

  // -----------------------------------------------------------------------
  // Step 4-5: Ask LLM if a follow-up query would be useful
  // -----------------------------------------------------------------------
  if (primaryStep.result != null) {
    try {
      const followUpQuery = await provider.suggestFollowUp(
        primaryStep.query,
        primaryStep.result,
        schemaAnalysis,
      );

      if (followUpQuery) {
        const followUpStep = await validateAndExecute(
          schema,
          followUpQuery,
          options,
        );
        steps.push(followUpStep);
      }
    } catch {
      // Follow-up is best-effort — don't fail the whole request if it errors.
    }
  }

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
  options?: OrchestrateOptions,
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

    const { valid, errors } = validateGeneratedQuery(schema, queryString);

    if (valid) {
      const result = await executeQuery(schema, queryString, options);
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

/**
 * Validate and execute a pre-generated query (used for follow-up steps).
 * No retries — if the follow-up is invalid, just report it.
 */
async function validateAndExecute(
  schema: GraphQLSchema,
  queryString: string,
  options?: OrchestrateOptions,
): Promise<QueryStep> {
  const { valid, errors } = validateGeneratedQuery(schema, queryString);

  if (!valid) {
    return {
      query: queryString,
      validationStatus: 'invalid',
      error: `Follow-up query validation failed: ${errors.map((e) => e.message).join(', ')}`,
      retryCount: 0,
    };
  }

  const result = await executeQuery(schema, queryString, options);
  return {
    query: queryString,
    validationStatus: 'valid',
    result: result.data,
    error: result.error,
    retryCount: 0,
  };
}

// ---------------------------------------------------------------------------
// Query execution — local or proxied to external endpoint
// ---------------------------------------------------------------------------

interface ExecutionResult {
  data?: Record<string, unknown> | null;
  error?: string;
}

/**
 * Execute a GraphQL query either locally (via graphql()) or by proxying the
 * request to an external endpoint when `options.executeEndpoint` is set.
 */
async function executeQuery(
  schema: GraphQLSchema,
  queryString: string,
  options?: OrchestrateOptions,
): Promise<ExecutionResult> {
  if (options?.executeEndpoint) {
    return executeRemote(queryString, options.executeEndpoint, options.executeHeaders);
  }
  return executeLocal(schema, queryString);
}

async function executeLocal(
  schema: GraphQLSchema,
  queryString: string,
): Promise<ExecutionResult> {
  const result = await graphql({ schema, source: queryString });
  return {
    data: result.data as Record<string, unknown> | undefined,
    error: result.errors?.[0]?.message,
  };
}

async function executeRemote(
  queryString: string,
  endpoint: string,
  headers?: Record<string, string>,
): Promise<ExecutionResult> {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...headers,
      },
      body: JSON.stringify({ query: queryString }),
      signal: AbortSignal.timeout(EXTERNAL_EXEC_TIMEOUT_MS),
    });

    if (!response.ok) {
      return { error: `External endpoint returned HTTP ${response.status}` };
    }

    const json = (await response.json()) as {
      data?: Record<string, unknown> | null;
      errors?: Array<{ message?: string }>;
    };

    return {
      data: json.data ?? undefined,
      error: json.errors?.[0]?.message,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { error: `Failed to execute against external endpoint: ${message}` };
  }
}

/**
 * Build the final AIQueryResponse from steps, preserving backward
 * compatibility by copying primary step fields to the top level.
 */
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
