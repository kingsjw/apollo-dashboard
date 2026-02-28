/**
 * Gemini AI provider — uses @google/genai to call Gemini 2.5 Flash
 * for GraphQL query generation with graph-aware prompting.
 */

import { GoogleGenAI } from '@google/genai';
import type { AIProvider } from './provider.js';
import type { SchemaAnalysis } from '../schema/analyzer.js';
import { generateLLMContext } from '../schema/analyzer.js';

const SYSTEM_INSTRUCTION_QUERY = `You are an expert GraphQL query generator. You receive a structured description of a GraphQL schema's graph structure (types, relationships, entry points, enums, input types) along with the raw SDL for reference.

Your task:
1. Read the graph structure carefully — understand which types relate to which, what the entry points (queries/mutations) are, and what arguments they accept.
2. Generate a valid GraphQL query that answers the user's natural-language request.
3. Always select appropriate fields — prefer returning useful scalar fields and traversing relations when relevant.
4. Use correct argument types — refer to the enums and input types provided.

Rules:
- Output ONLY the raw GraphQL query. No markdown, no explanation, no code fences.
- The query must be syntactically valid and conform to the schema.
- If the request is ambiguous, pick the most reasonable interpretation.`;

const SYSTEM_INSTRUCTION_FOLLOWUP = `You are an expert GraphQL analyst. You receive a GraphQL query that was executed, its result data, and the schema's graph structure.

Your task: Determine if a follow-up query would provide significantly more useful or complementary information based on the result.

Good follow-up examples:
- The first query returned a list of IDs — a follow-up could fetch details for those items.
- The first query returned summary data — a follow-up could fetch related entities via graph relationships.
- The first query returned items with foreign key fields — a follow-up could resolve those relationships.

When NO follow-up is needed:
- The result is already comprehensive with all relevant fields.
- The result is empty (no data to follow up on).
- The original query already traversed the relevant relationships.

If a follow-up IS useful, output ONLY the raw GraphQL query. No markdown, no explanation, no code fences.
If NO follow-up is needed, output exactly: NO_FOLLOWUP`;

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
        temperature: 0.2,
        maxOutputTokens: 1024,
      },
    });

    return this.cleanQueryOutput(response.text ?? '');
  }

  async suggestFollowUp(
    originalQuery: string,
    result: unknown,
    schemaAnalysis: SchemaAnalysis,
  ): Promise<string | null> {
    const graphContext = generateLLMContext(schemaAnalysis);
    const resultSnippet = JSON.stringify(result, null, 2).slice(0, 2000);

    const prompt = [
      `## Section 1: Graph Structure\n\n${graphContext}`,
      `## Section 2: Executed Query\n\n${originalQuery}`,
      `## Section 3: Query Result\n\n${resultSnippet}`,
    ].join('\n\n');

    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION_FOLLOWUP,
        temperature: 0.2,
        maxOutputTokens: 1024,
      },
    });

    const text = this.cleanQueryOutput(response.text ?? '');

    if (!text || text === 'NO_FOLLOWUP') {
      return null;
    }

    return text;
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
      `## Section 1: Structured Graph Context\n\n${graphContext}`,
      `## Section 2: Raw SDL Reference\n\n${schema}`,
      `## Section 3: Natural Language Request\n\n${nl}`,
    ];

    if (errors?.length) {
      sections.push(
        `## Section 4: Previous Validation Errors\n\nThe previous query attempt had these validation errors. Please fix them:\n${errors.map((e) => `- ${e}`).join('\n')}`,
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
