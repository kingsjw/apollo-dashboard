import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import http from 'http';
import cors from 'cors';
import { makeExecutableSchema } from '@graphql-tools/schema';
import type { AIQueryRequest } from '@apollo-dashboard/shared';

import typeDefs from './schema/typeDefs.js';
import { schemaSDL } from './schema/typeDefs.js';
import resolvers from './resolvers/index.js';
import { GeminiProvider } from './ai/gemini.js';
import { orchestrateQuery } from './orchestration/queryOrchestrator.js';
import { analyzeSchema, generateLLMContext } from './schema/analyzer.js';
import { introspectEndpoint } from './schema/introspector.js';

const PORT = Number(process.env.PORT) || 4000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// Build an executable schema for both Apollo Server and the orchestrator
const schema = makeExecutableSchema({ typeDefs, resolvers });

// Analyze the schema once at startup and cache the result
const schemaAnalysis = analyzeSchema(schema);

// ---------------------------------------------------------------------------
// Mutable state: tracks the currently active schema (built-in or external)
// ---------------------------------------------------------------------------
let currentSchema = schema;
let currentSchemaSDL = schemaSDL;
let currentSchemaAnalysis = schemaAnalysis;
let currentEndpoint: string | null = null; // null = built-in schema
let currentEndpointHeaders: Record<string, string> | undefined;

// Warn if GEMINI_API_KEY is not set, but allow the server to start
let geminiProvider: GeminiProvider | null = null;
if (GEMINI_API_KEY) {
  geminiProvider = new GeminiProvider(GEMINI_API_KEY);
} else {
  console.warn(
    'WARNING: GEMINI_API_KEY is not set. The /ai-query endpoint will return an error.',
  );
}

const app = express();
const httpServer = http.createServer(app);

// Apply CORS globally so preflight OPTIONS requests are handled
app.use(cors({ origin: CORS_ORIGIN }));

const server = new ApolloServer({
  schema,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});

await server.start();

app.use('/graphql', express.json(), expressMiddleware(server));

app.post('/ai-query', express.json(), async (req, res) => {
  if (!geminiProvider) {
    res.status(503).json({
      steps: [],
      query: '',
      validationStatus: 'invalid',
      error: 'GEMINI_API_KEY is not configured. AI query generation is unavailable.',
      retryCount: 0,
    });
    return;
  }

  try {
    const { naturalLanguage } = req.body as AIQueryRequest;

    if (!naturalLanguage || typeof naturalLanguage !== 'string') {
      res.status(400).json({
        steps: [],
        query: '',
        validationStatus: 'invalid',
        error: 'Missing required field: naturalLanguage',
        retryCount: 0,
      });
      return;
    }

    const result = await orchestrateQuery(
      geminiProvider,
      currentSchema,
      currentSchemaSDL,
      currentSchemaAnalysis,
      naturalLanguage,
      currentEndpoint
        ? { executeEndpoint: currentEndpoint, executeHeaders: currentEndpointHeaders }
        : undefined,
    );
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('AI query error:', message);
    res.status(500).json({
      steps: [],
      query: '',
      validationStatus: 'invalid',
      error: `AI query generation failed: ${message}`,
      retryCount: 0,
    });
  }
});

// ---------------------------------------------------------------------------
// POST /connect-endpoint — introspect an external GraphQL API
// ---------------------------------------------------------------------------
app.post('/connect-endpoint', express.json(), async (req, res) => {
  const { endpoint, headers } = req.body as {
    endpoint: string;
    headers?: Record<string, string>;
  };

  if (!endpoint) {
    res.status(400).json({ error: 'Missing required field: endpoint' });
    return;
  }

  try {
    const introspectionResult = await introspectEndpoint({ endpoint, headers });
    const analysis = analyzeSchema(introspectionResult.schema);

    // Update the active schema state
    currentSchema = introspectionResult.schema;
    currentSchemaSDL = introspectionResult.sdl;
    currentSchemaAnalysis = analysis;
    currentEndpoint = endpoint;
    currentEndpointHeaders = headers;

    res.json({
      success: true,
      endpoint,
      analysis: {
        types: analysis.types.length,
        relationships: analysis.relationships.length,
        queries: analysis.entryPoints.filter((e) => e.type === 'query').length,
        mutations: analysis.entryPoints.filter((e) => e.type === 'mutation').length,
        enums: analysis.enums.length,
      },
      sdl: introspectionResult.sdl,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error: `Failed to connect: ${message}` });
  }
});

// ---------------------------------------------------------------------------
// POST /disconnect-endpoint — revert to the built-in schema
// ---------------------------------------------------------------------------
app.post('/disconnect-endpoint', (_req, res) => {
  currentSchema = schema;
  currentSchemaSDL = schemaSDL;
  currentSchemaAnalysis = schemaAnalysis;
  currentEndpoint = null;
  currentEndpointHeaders = undefined;
  res.json({ success: true, message: 'Reverted to built-in schema' });
});

// ---------------------------------------------------------------------------
// GET /schema-info — return current schema analysis + LLM context
// ---------------------------------------------------------------------------
app.get('/schema-info', (_req, res) => {
  res.json({
    analysis: currentSchemaAnalysis,
    llmContext: generateLLMContext(currentSchemaAnalysis),
    endpoint: currentEndpoint,
  });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

httpServer.listen(PORT, () => {
  console.log(`Server ready at http://localhost:${PORT}/graphql`);
});
