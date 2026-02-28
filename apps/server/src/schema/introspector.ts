/**
 * External GraphQL endpoint introspector.
 *
 * Connects to any external GraphQL endpoint, introspects its schema,
 * and returns a buildable GraphQLSchema + SDL string. Includes an
 * in-memory cache with TTL to avoid redundant network calls.
 */

import {
  getIntrospectionQuery,
  buildClientSchema,
  printSchema,
} from 'graphql';
import type { GraphQLSchema, IntrospectionQuery } from 'graphql';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IntrospectionOptions {
  /** The URL of the external GraphQL endpoint to introspect. */
  endpoint: string;
  /** Optional headers (auth tokens, API keys, etc.) sent with the request. */
  headers?: Record<string, string>;
}

export interface IntrospectionResult {
  /** The executable GraphQLSchema built from the introspection response. */
  schema: GraphQLSchema;
  /** The schema printed as SDL (useful for AI prompt injection). */
  sdl: string;
  /** The endpoint that was introspected. */
  endpoint: string;
  /** Timestamp when the schema was fetched. */
  fetchedAt: Date;
}

// ---------------------------------------------------------------------------
// Custom error
// ---------------------------------------------------------------------------

export class IntrospectionError extends Error {
  constructor(
    message: string,
    public readonly endpoint: string,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = 'IntrospectionError';
  }
}

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

/** Default cache TTL: 5 minutes. */
const CACHE_TTL_MS = 5 * 60 * 1000;

const schemaCache = new Map<string, IntrospectionResult>();

/**
 * Retrieve a cached introspection result for the given endpoint.
 * Returns `undefined` if no entry exists or the entry has expired.
 */
export function getCachedSchema(
  endpoint: string,
): IntrospectionResult | undefined {
  const cached = schemaCache.get(endpoint);
  if (!cached) return undefined;

  const age = Date.now() - cached.fetchedAt.getTime();
  if (age > CACHE_TTL_MS) {
    schemaCache.delete(endpoint);
    return undefined;
  }

  return cached;
}

/**
 * Clear cached schemas.
 * - If `endpoint` is provided, only that entry is removed.
 * - If omitted, the entire cache is cleared.
 */
export function clearSchemaCache(endpoint?: string): void {
  if (endpoint) {
    schemaCache.delete(endpoint);
  } else {
    schemaCache.clear();
  }
}

// ---------------------------------------------------------------------------
// Introspection
// ---------------------------------------------------------------------------

/** Timeout for the introspection fetch request (10 seconds). */
const FETCH_TIMEOUT_MS = 10_000;

/**
 * Introspect an external GraphQL endpoint and return its schema.
 *
 * Steps:
 * 1. Send the standard introspection query to the endpoint.
 * 2. Parse and validate the JSON response.
 * 3. Build a `GraphQLSchema` with `buildClientSchema`.
 * 4. Generate SDL with `printSchema`.
 * 5. Cache and return the result.
 *
 * The function checks the cache first and returns a cached result when
 * available (within the TTL window).
 */
export async function introspectEndpoint(
  options: IntrospectionOptions,
): Promise<IntrospectionResult> {
  const { endpoint, headers } = options;

  // Return cached result if still valid
  const cached = getCachedSchema(endpoint);
  if (cached) return cached;

  // Build the introspection request
  const introspectionQuery = getIntrospectionQuery();

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...headers,
      },
      body: JSON.stringify({ query: introspectionQuery }),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'TimeoutError') {
      throw new IntrospectionError(
        `Introspection request timed out after ${FETCH_TIMEOUT_MS / 1000}s`,
        endpoint,
      );
    }

    // Generic network error (DNS failure, connection refused, etc.)
    const message =
      err instanceof Error ? err.message : 'Unknown network error';
    throw new IntrospectionError(
      `Failed to reach endpoint: ${message}`,
      endpoint,
    );
  }

  // Handle HTTP-level errors
  if (!response.ok) {
    const status = response.status;

    if (status === 401 || status === 403) {
      throw new IntrospectionError(
        `Authentication failed (HTTP ${status}). Check your headers / API key.`,
        endpoint,
        status,
      );
    }

    // Some production APIs return 400 when introspection is disabled
    let bodyText: string;
    try {
      bodyText = await response.text();
    } catch {
      bodyText = '';
    }

    throw new IntrospectionError(
      `Endpoint returned HTTP ${status}: ${bodyText || response.statusText}`,
      endpoint,
      status,
    );
  }

  // Parse JSON response
  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new IntrospectionError(
      'Response is not valid JSON. The endpoint may not be a GraphQL server.',
      endpoint,
    );
  }

  // Validate the response shape
  const body = json as { data?: IntrospectionQuery; errors?: unknown[] };

  if (body.errors && !body.data) {
    const errorMessages = (body.errors as Array<{ message?: string }>)
      .map((e) => e.message ?? 'Unknown error')
      .join('; ');
    throw new IntrospectionError(
      `Introspection query returned errors: ${errorMessages}. ` +
        'Introspection may be disabled on this endpoint.',
      endpoint,
    );
  }

  if (!body.data || !body.data.__schema) {
    throw new IntrospectionError(
      'Response does not contain introspection data. ' +
        'The endpoint may not support introspection.',
      endpoint,
    );
  }

  // Build schema from introspection data
  let schema: GraphQLSchema;
  try {
    schema = buildClientSchema(body.data);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Unknown error building schema';
    throw new IntrospectionError(
      `Failed to build schema from introspection data: ${message}`,
      endpoint,
    );
  }

  // Generate SDL
  const sdl = printSchema(schema);

  const result: IntrospectionResult = {
    schema,
    sdl,
    endpoint,
    fetchedAt: new Date(),
  };

  // Cache the result
  schemaCache.set(endpoint, result);

  return result;
}
