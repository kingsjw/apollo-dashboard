import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import http from 'http';
import cors from 'cors';

import typeDefs from './schema/typeDefs.js';
import resolvers from './resolvers/index.js';

const PORT = Number(process.env.PORT) || 4000;

const app = express();
const httpServer = http.createServer(app);

const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});

await server.start();

app.use('/graphql', cors(), express.json(), expressMiddleware(server));

app.post('/ai-query', express.json(), (_req, res) => {
  res.json({ message: 'AI query endpoint - will be implemented in Phase 3' });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

httpServer.listen(PORT, () => {
  console.log(`Server ready at http://localhost:${PORT}/graphql`);
});
