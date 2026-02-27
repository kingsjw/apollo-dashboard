import { useState, useCallback } from 'react';
import type { AIQueryResponse } from '@apollo-dashboard/shared';
import { fetchAIQuery } from '../api/aiQuery';

interface UseAIQueryState {
  data: AIQueryResponse | null;
  loading: boolean;
  error: string | null;
}

export function useAIQuery() {
  const [state, setState] = useState<UseAIQueryState>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async (naturalLanguage: string) => {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await fetchAIQuery(naturalLanguage);
      setState({ data, loading: false, error: null });
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setState({ data: null, loading: false, error: message });
      return null;
    }
  }, []);

  return { ...state, execute };
}
