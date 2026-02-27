/**
 * Query Orchestrator — coordinates the full AI query pipeline:
 *   1. Send natural-language prompt + schema to AI provider
 *   2. Validate the generated query against the schema
 *   3. If invalid, retry up to MAX_RETRIES times with correction context
 *   4. Execute the valid query via graphql()
 *   5. Return generated query + validation status + execution result
 */

import type { AIProvider } from '../ai/provider.js';
import { validateGeneratedQuery } from '../validation/validateQuery.js';
import { graphql } from 'graphql';
import type { GraphQLSchema } from 'graphql';
import type { AIQueryResponse } from '@apollo-dashboard/shared';

const MAX_RETRIES = 2;

export async function orchestrateQuery(
  provider: AIProvider,
  schema: GraphQLSchema,
  schemaSDL: string,
  naturalLanguage: string,
): Promise<AIQueryResponse> {
  let attempt = 0;
  let queryString = '';
  let lastErrors: string[] = [];

  while (attempt <= MAX_RETRIES) {
    queryString = await provider.generateQuery(
      naturalLanguage,
      schemaSDL,
      lastErrors.length ? lastErrors : undefined,
    );

    const { valid, errors } = validateGeneratedQuery(schema, queryString);

    if (valid) {
      const result = await graphql({ schema, source: queryString });
      return {
        query: queryString,
        validationStatus: attempt > 0 ? 'corrected' : 'valid',
        result: result.data,
        error: result.errors?.[0]?.message,
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
