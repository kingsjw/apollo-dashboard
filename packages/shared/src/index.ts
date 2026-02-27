export interface AIQueryRequest {
  naturalLanguage: string;
}

export interface AIQueryResponse {
  query: string;
  validationStatus: 'valid' | 'invalid' | 'corrected';
  result?: unknown;
  error?: string;
  retryCount: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
