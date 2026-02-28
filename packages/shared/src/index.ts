export interface AIQueryRequest {
  naturalLanguage: string;
}

export interface QueryStep {
  query: string;
  validationStatus: 'valid' | 'invalid' | 'corrected';
  result?: unknown;
  error?: string;
  retryCount: number;
}

export interface AIQueryResponse {
  steps: QueryStep[];           // all execution steps
  query: string;                // primary query (first step, for backward compat)
  validationStatus: 'valid' | 'invalid' | 'corrected';
  result?: unknown;             // primary result
  error?: string;
  retryCount: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
