import type { AIQueryRequest, AIQueryResponse } from '@apollo-dashboard/shared';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export async function fetchAIQuery(naturalLanguage: string): Promise<AIQueryResponse> {
  const res = await fetch(`${API_URL}/ai-query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ naturalLanguage } satisfies AIQueryRequest),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export interface SchemaInfoResponse {
  analysis: {
    types: Array<{ name: string }>;
    entryPoints: Array<{ name: string; type: string }>;
    enums: Array<{ name: string }>;
    relationships: unknown[];
  };
  llmContext: string;
  exampleQueries: Array<{ text: string; category: string }>;
}

export async function fetchSchemaInfo(): Promise<SchemaInfoResponse> {
  const res = await fetch(`${API_URL}/schema-info`);
  if (!res.ok) throw new Error(`Schema info failed: ${res.status}`);
  return res.json();
}
