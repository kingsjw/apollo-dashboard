import express from 'express';
import type { AIQueryRequest } from '@apollo-dashboard/shared';

const app = express();
const PORT = 4000;

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/ai-query', (req, res) => {
  const body = req.body as AIQueryRequest;
  res.json({
    message: 'AI query endpoint placeholder',
    received: body.naturalLanguage,
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
