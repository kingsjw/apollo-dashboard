/**
 * Gemini AI provider — uses @google/genai to call Gemini 2.5 Flash
 * for GraphQL query generation.
 */

import { GoogleGenAI } from '@google/genai';
import type { AIProvider } from './provider.js';

export class GeminiProvider implements AIProvider {
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateQuery(
    naturalLanguage: string,
    schemaSDL: string,
    previousErrors?: string[],
  ): Promise<string> {
    const prompt = this.buildPrompt(naturalLanguage, schemaSDL, previousErrors);

    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'You are a GraphQL query generator. Output ONLY the raw GraphQL query. No markdown, no explanation, no code fences.',
        temperature: 0.2,
        maxOutputTokens: 1024,
      },
    });

    return response.text?.trim() ?? '';
  }

  private buildPrompt(
    nl: string,
    schema: string,
    errors?: string[],
  ): string {
    let prompt = `GraphQL Schema:\n${schema}\n\nRequest: ${nl}`;
    if (errors?.length) {
      prompt += `\n\nPrevious attempt had these validation errors:\n${errors.join('\n')}\nPlease fix them.`;
    }
    return prompt;
  }
}
