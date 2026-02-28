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

export interface ConnectEndpointResponse {
  success: boolean;
  analysis: {
    types: number;
    queries: number;
    mutations: number;
    subscriptions: number;
  };
  sdl: string;
}

export async function connectEndpoint(
  endpoint: string,
  headers?: Record<string, string>,
): Promise<ConnectEndpointResponse> {
  const res = await fetch(`${API_URL}/connect-endpoint`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint, headers }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || `Connection failed: ${res.status}`);
  }
  return res.json();
}

export async function disconnectEndpoint(): Promise<{ success: boolean }> {
  const res = await fetch(`${API_URL}/disconnect-endpoint`, { method: 'POST' });
  if (!res.ok) throw new Error(`Disconnect failed: ${res.status}`);
  return res.json();
}

export interface SchemaInfoResponse {
  analysis: {
    types: number;
    queries: number;
    mutations: number;
    subscriptions: number;
  };
  llmContext: string;
  endpoint: string | null;
}

export async function fetchSchemaInfo(): Promise<SchemaInfoResponse> {
  const res = await fetch(`${API_URL}/schema-info`);
  if (!res.ok) throw new Error(`Schema info failed: ${res.status}`);
  return res.json();
}
