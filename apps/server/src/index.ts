import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import http from 'http';
import cors from 'cors';
import { makeExecutableSchema } from '@graphql-tools/schema';
import type { AIQueryRequest, ExampleQuery } from '@apollo-dashboard/shared';

import typeDefs from './schema/typeDefs.js';
import { schemaSDL } from './schema/typeDefs.js';
import resolvers from './resolvers/index.js';
import { OpenRouterProvider } from './ai/openrouter.js';
import { orchestrateQuery } from './orchestration/queryOrchestrator.js';
import { analyzeSchema, generateLLMContext } from './schema/analyzer.js';

const PORT = Number(process.env.PORT) || 4000;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL; // optional override
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';

// Build an executable schema for both Apollo Server and the orchestrator
const schema = makeExecutableSchema({ typeDefs, resolvers });

// Analyze the schema once at startup and cache the result
const schemaAnalysis = analyzeSchema(schema);

// Warn if OPENROUTER_API_KEY is not set, but allow the server to start
let aiProvider: OpenRouterProvider | null = null;
if (OPENROUTER_API_KEY) {
  aiProvider = new OpenRouterProvider(OPENROUTER_API_KEY, OPENROUTER_MODEL);
  console.log(`AI provider: OpenRouter (model: ${OPENROUTER_MODEL ?? 'google/gemini-3-flash-preview'})`);
} else {
  console.warn(
    'WARNING: OPENROUTER_API_KEY is not set. The /ai-query endpoint will return an error.',
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
  if (!aiProvider) {
    res.status(503).json({
      steps: [],
      query: '',
      validationStatus: 'invalid',
      error: 'OPENROUTER_API_KEY is not configured. AI query generation is unavailable.',
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
      aiProvider,
      schema,
      schemaSDL,
      schemaAnalysis,
      naturalLanguage,
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
// GET /schema-info — return current schema analysis + LLM context
// ---------------------------------------------------------------------------
const builtInExampleQueries: ExampleQuery[] = [
  { text: '유저 전체 조회', category: 'E-Commerce' },
  { text: '배송중인 주문 조회', category: 'E-Commerce' },
  { text: '가장 비싼 상품 조회', category: 'E-Commerce' },
  { text: '전자기기 상품 조회', category: 'E-Commerce' },
  { text: '코스피 종목 조회', category: 'Stock Market' },
  { text: '삼성전자 현재가 조회', category: 'Stock Market' },
  { text: '수익률 상위 3명 조회', category: 'Stock Market' },
  { text: '바이오 섹터 종목 조회', category: 'Stock Market' },
  { text: 'Tom 포트폴리오 조회', category: 'Cross-Domain' },
  { text: 'Tom 주문 내역 조회', category: 'Cross-Domain' },
  { text: '유저별 주문금액, 수익률 조회', category: 'Cross-Domain' },
];

app.get('/schema-info', (_req, res) => {
  res.json({
    analysis: schemaAnalysis,
    llmContext: generateLLMContext(schemaAnalysis),
    exampleQueries: builtInExampleQueries,
  });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

httpServer.listen(PORT, () => {
  console.log(`Server ready at http://localhost:${PORT}/graphql`);
});
