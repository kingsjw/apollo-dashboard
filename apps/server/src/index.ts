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

const PORT = Number(process.env.PORT) || 4000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// Build an executable schema for both Apollo Server and the orchestrator
const schema = makeExecutableSchema({ typeDefs, resolvers });

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

const server = new ApolloServer({
  schema,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});

await server.start();

app.use('/graphql', cors({ origin: CORS_ORIGIN }), express.json(), expressMiddleware(server));

app.post('/ai-query', cors({ origin: CORS_ORIGIN }), express.json(), async (req, res) => {
  if (!geminiProvider) {
    res.status(503).json({
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
        query: '',
        validationStatus: 'invalid',
        error: 'Missing required field: naturalLanguage',
        retryCount: 0,
      });
      return;
    }

    const result = await orchestrateQuery(
      geminiProvider,
      schema,
      schemaSDL,
      naturalLanguage,
    );
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('AI query error:', message);
    res.status(500).json({
      query: '',
      validationStatus: 'invalid',
      error: `AI query generation failed: ${message}`,
      retryCount: 0,
    });
  }
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

httpServer.listen(PORT, () => {
  console.log(`Server ready at http://localhost:${PORT}/graphql`);
});
