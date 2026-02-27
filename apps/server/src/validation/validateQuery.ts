import { parse, validate } from 'graphql';
import type { GraphQLSchema, GraphQLError } from 'graphql';

/**
 * Validates a GraphQL query string against a schema.
 *
 * Parses the query first (catching syntax errors), then runs
 * graphql.validate() to check it against the provided schema.
 */
export function validateGeneratedQuery(
  schema: GraphQLSchema,
  queryString: string,
): { valid: boolean; errors: ReadonlyArray<GraphQLError> } {
  let documentAST;
  try {
    documentAST = parse(queryString);
  } catch (syntaxError) {
    return { valid: false, errors: [syntaxError as GraphQLError] };
  }

  const errors = validate(schema, documentAST);
  return { valid: errors.length === 0, errors };
}
