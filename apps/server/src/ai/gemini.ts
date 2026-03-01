/**
 * Gemini AI provider — uses @google/genai to call Gemini 2.5 Flash
 * for GraphQL query generation with graph-aware prompting.
 */

import { GoogleGenAI } from '@google/genai';
import type { AIProvider } from './provider.js';
import type { SchemaAnalysis } from '../schema/analyzer.js';
import { generateLLMContext } from '../schema/analyzer.js';

const SYSTEM_INSTRUCTION_QUERY = `You are a GraphQL query generator. You understand ANY language (Korean, English, Japanese, etc.).

Given a schema and a user request, output EXACTLY ONE of:
A) A valid GraphQL query — if the request relates to any data in the schema
B) The literal text NONE — if the request is completely unrelated to the schema (e.g. stocks, weather, crypto on an e-commerce schema)

Output rules:
- No markdown fences, no explanation, no commentary. Just the query or NONE.
- Match the user's INTENT to the correct schema entry point:
  users/people → users or user(id)
  orders/purchases/shipping → orders or order(id)
  products/items/goods → products or product(id)
  categories → categories
  create/cancel → appropriate mutation
- Include useful fields and traverse relations when relevant.
- Use correct argument types from the schema.`;

export class GeminiProvider implements AIProvider {
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateQuery(
    naturalLanguage: string,
    schemaSDL: string,
    schemaAnalysis: SchemaAnalysis,
    previousErrors?: string[],
  ): Promise<string> {
    const prompt = this.buildQueryPrompt(
      naturalLanguage,
      schemaSDL,
      schemaAnalysis,
      previousErrors,
    );

    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_QUERY,
        temperature: 0.1,
        maxOutputTokens: 1024,
      },
    });

    const output = this.cleanQueryOutput(response.text ?? '');
    return output;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Build SNAIL-inspired prompt with 4 sections:
   *   1. Structured graph context (from generateLLMContext)
   *   2. Raw SDL for reference
   *   3. Natural language request
   *   4. Previous errors (if retry)
   */
  private buildQueryPrompt(
    nl: string,
    schema: string,
    analysis: SchemaAnalysis,
    errors?: string[],
  ): string {
    const graphContext = generateLLMContext(analysis);

    const sections = [
      `## User Request\n\n${nl}`,
      `## Schema Entry Points & Graph Structure\n\n${graphContext}`,
      `## Full SDL Reference\n\n${schema}`,
    ];

    if (errors?.length) {
      sections.push(
        `## Previous Validation Errors\n\nThe previous query attempt had these validation errors. Please fix them:\n${errors.map((e) => `- ${e}`).join('\n')}`,
      );
    }

    return sections.join('\n\n');
  }

  /** Strip markdown fences and whitespace from LLM output. */
  private cleanQueryOutput(raw: string): string {
    let text = raw.trim();
    // Remove ```graphql ... ``` or ``` ... ``` fences
    text = text.replace(/^```(?:graphql)?\s*\n?/i, '').replace(/\n?```\s*$/, '');
    return text.trim();
  }
}
