/**
 * OpenRouter AI provider — uses OpenRouter's OpenAI-compatible API
 * for GraphQL query generation. No extra SDK needed, just fetch.
 */

import type { AIProvider } from './provider.js';
import type { SchemaAnalysis } from '../schema/analyzer.js';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterResponse {
  choices?: Array<{
    message?: { content?: string };
  }>;
  error?: { message?: string };
}

export class OpenRouterProvider implements AIProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey;
    this.model = model ?? 'google/gemini-3-flash-preview';
  }

  async generateQuery(
    naturalLanguage: string,
    schemaSDL: string,
    _schemaAnalysis: SchemaAnalysis,
    previousErrors?: string[],
  ): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are a GraphQL query assistant for a specific schema. You understand Korean, English, and other languages.

When the user's request CAN be answered by the schema:
- Output ONLY the raw GraphQL query. No explanation, no markdown.

When the user's request CANNOT be answered by the schema (e.g. asking about weather, crypto, or any data not in the schema):
- Output a short explanation in the user's language about what data IS available.

IMPORTANT intent mappings (Korean → GraphQL):
- 유저/사람/사용자 → users query
- 주문/결제 → orders query
- 상품/제품 → products query
- 주식/종목/코스피/코스닥/티커 → stocks query
- 포트폴리오/수익률/보유종목/투자 → portfolios or portfolio(userId) query
- 수익률 높은/좋은 사람/유저 → portfolios query with user and totalReturnRate fields

IMPORTANT: Do NOT force-fit unrelated requests into a query. If the request is about data not in the schema, just explain what's available.`,
      },
      {
        role: 'user',
        content: `GraphQL schema:\n\n${schemaSDL}\n\nAvailable reference data (use these IDs in queries):\n- Users: Tom (user-1), Johnny (user-2), Ruben (user-3), Amber (user-4), Jaxtyn (user-5), Jasmin (user-6), Joel (user-7), Kane (user-8), Lily (user-9), Sam (user-10), Scotty (user-11), Klee (user-12)\n- Products: Wireless Headphones (prod-1), Mechanical Keyboard (prod-2), Running Shoes (prod-3), Denim Jacket (prod-4), Coffee Maker (prod-5), Cast Iron Skillet (prod-6), TypeScript Handbook (prod-7), GraphQL in Action (prod-8)\n- Categories: Electronics (cat-1), Clothing (cat-2), Home & Kitchen (cat-3), Books (cat-4)\n- Stocks: 삼성전자/005930 (stock-1), SK하이닉스/000660 (stock-2), LG에너지솔루션/373220 (stock-3), 현대차/005380 (stock-4), 기아/000270 (stock-5), 네이버/035420 (stock-6), 카카오/035720 (stock-7), LG화학/051910 (stock-8), 삼성SDI/006400 (stock-9), 셀트리온/068270 (stock-10), 에코프로비엠/247540 (stock-11), 셀트리온헬스케어/091990 (stock-12), 펄어비스/263750 (stock-13), 알테오젠/196170 (stock-14), HLB/028300 (stock-15)`,
      },
      {
        role: 'assistant',
        content: 'Understood. I will output a query if the request matches the schema, or explain what data is available if it does not.',
      },
      {
        role: 'user',
        content: previousErrors?.length
          ? `${naturalLanguage}\n\n(Previous attempt had errors: ${previousErrors.join(', ')}. Fix them.)`
          : naturalLanguage,
      },
    ];

    const output = await this.chatRaw(messages);
    return output;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async chatRaw(messages: ChatMessage[]): Promise<string> {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.0,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenRouter API error ${response.status}: ${text}`);
    }

    const json = (await response.json()) as OpenRouterResponse;

    if (json.error?.message) {
      throw new Error(`OpenRouter error: ${json.error.message}`);
    }

    const raw = json.choices?.[0]?.message?.content ?? '';
    return this.cleanOutput(raw);
  }

  private cleanOutput(raw: string): string {
    let text = raw.trim();
    text = text.replace(/^```(?:graphql)?\s*\n?/i, '').replace(/\n?```\s*$/, '');
    return text.trim();
  }
}
