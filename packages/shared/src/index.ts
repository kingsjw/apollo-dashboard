export interface AIQueryRequest {
  naturalLanguage: string;
}

export interface QueryStep {
  query: string;
  validationStatus: 'valid' | 'invalid' | 'corrected' | 'out_of_scope';
  result?: unknown;
  error?: string;
  message?: string;
  retryCount: number;
}

export interface AIQueryResponse {
  steps: QueryStep[];           // all execution steps
  query: string;                // primary query (first step, for backward compat)
  validationStatus: 'valid' | 'invalid' | 'corrected' | 'out_of_scope';
  result?: unknown;             // primary result
  error?: string;
  message?: string;             // AI explanation (e.g. out-of-scope reason)
  retryCount: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface ExampleQuery {
  text: string;
  category: string;
}
