import {
  type GraphQLSchema,
  type GraphQLType,
  type GraphQLNamedType,
  isObjectType,
  isEnumType,
  isInputObjectType,
  isListType,
  isNonNullType,
  getNamedType,
} from 'graphql';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface TypeRelationship {
  fromType: string;
  field: string;
  toType: string;
  isList: boolean;
  isNonNull: boolean;
}

export interface EntryPoint {
  name: string;
  type: 'query' | 'mutation';
  args: Array<{ name: string; type: string; required: boolean }>;
  returnType: string;
  isList: boolean;
}

export interface SchemaAnalysis {
  types: Array<{
    name: string;
    fields: Array<{ name: string; type: string; isRelation: boolean }>;
    description?: string;
  }>;
  relationships: TypeRelationship[];
  entryPoints: EntryPoint[];
  enums: Array<{ name: string; values: string[] }>;
  inputTypes: Array<{
    name: string;
    fields: Array<{ name: string; type: string; required: boolean }>;
  }>;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Returns the human-readable type string, e.g. `[Product!]!` */
function typeToString(type: GraphQLType): string {
  if (isNonNullType(type)) {
    return `${typeToString(type.ofType)}!`;
  }
  if (isListType(type)) {
    return `[${typeToString(type.ofType)}]`;
  }
  return (type as GraphQLNamedType).name ?? String(type);
}

/** Checks whether the outermost (possibly non-null-wrapped) type is a list. */
function isList(type: GraphQLType): boolean {
  if (isNonNullType(type)) {
    return isListType(type.ofType);
  }
  return isListType(type);
}

/** Checks whether the outermost wrapper is NonNull. */
function isNonNull(type: GraphQLType): boolean {
  return isNonNullType(type);
}

/** Skip introspection types (names starting with __). */
function isIntrospection(name: string): boolean {
  return name.startsWith('__');
}

// ---------------------------------------------------------------------------
// Extraction functions
// ---------------------------------------------------------------------------

function extractRelationships(schema: GraphQLSchema): TypeRelationship[] {
  const relationships: TypeRelationship[] = [];
  const typeMap = schema.getTypeMap();

  for (const [typeName, type] of Object.entries(typeMap)) {
    if (isIntrospection(typeName)) continue;
    if (!isObjectType(type)) continue;
    // Skip root types — their fields are entry points, not relationships.
    if (
      type === schema.getQueryType() ||
      type === schema.getMutationType() ||
      type === schema.getSubscriptionType()
    ) {
      continue;
    }

    const fields = type.getFields();
    for (const [fieldName, field] of Object.entries(fields)) {
      const namedType = getNamedType(field.type);
      if (namedType && isObjectType(namedType)) {
        relationships.push({
          fromType: typeName,
          field: fieldName,
          toType: namedType.name,
          isList: isList(field.type),
          isNonNull: isNonNull(field.type),
        });
      }
    }
  }

  return relationships;
}

function extractEntryPoints(schema: GraphQLSchema): EntryPoint[] {
  const entryPoints: EntryPoint[] = [];

  const rootTypes: Array<{
    rootType: ReturnType<GraphQLSchema['getQueryType']>;
    kind: 'query' | 'mutation';
  }> = [
    { rootType: schema.getQueryType(), kind: 'query' },
    { rootType: schema.getMutationType(), kind: 'mutation' },
  ];

  for (const { rootType, kind } of rootTypes) {
    if (!rootType) continue;
    const fields = rootType.getFields();

    for (const [fieldName, field] of Object.entries(fields)) {
      const namedType = getNamedType(field.type);
      entryPoints.push({
        name: fieldName,
        type: kind,
        args: field.args.map((arg) => ({
          name: arg.name,
          type: typeToString(arg.type),
          required: isNonNull(arg.type),
        })),
        returnType: typeToString(field.type),
        isList: isList(field.type),
      });
    }
  }

  return entryPoints;
}

function extractTypes(schema: GraphQLSchema, relationships: TypeRelationship[]) {
  const typeMap = schema.getTypeMap();
  const relationFields = new Set(
    relationships.map((r) => `${r.fromType}.${r.field}`),
  );

  const types: SchemaAnalysis['types'] = [];

  for (const [typeName, type] of Object.entries(typeMap)) {
    if (isIntrospection(typeName)) continue;
    if (!isObjectType(type)) continue;
    if (
      type === schema.getQueryType() ||
      type === schema.getMutationType() ||
      type === schema.getSubscriptionType()
    ) {
      continue;
    }

    const fields = type.getFields();
    types.push({
      name: typeName,
      fields: Object.entries(fields).map(([fieldName, field]) => ({
        name: fieldName,
        type: typeToString(field.type),
        isRelation: relationFields.has(`${typeName}.${fieldName}`),
      })),
      ...(type.description ? { description: type.description } : {}),
    });
  }

  return types;
}

function extractEnums(schema: GraphQLSchema): SchemaAnalysis['enums'] {
  const typeMap = schema.getTypeMap();
  const enums: SchemaAnalysis['enums'] = [];

  for (const [typeName, type] of Object.entries(typeMap)) {
    if (isIntrospection(typeName)) continue;
    if (!isEnumType(type)) continue;

    enums.push({
      name: typeName,
      values: type.getValues().map((v) => v.name),
    });
  }

  return enums;
}

function extractInputTypes(schema: GraphQLSchema): SchemaAnalysis['inputTypes'] {
  const typeMap = schema.getTypeMap();
  const inputTypes: SchemaAnalysis['inputTypes'] = [];

  for (const [typeName, type] of Object.entries(typeMap)) {
    if (isIntrospection(typeName)) continue;
    if (!isInputObjectType(type)) continue;

    const fields = type.getFields();
    inputTypes.push({
      name: typeName,
      fields: Object.entries(fields).map(([fieldName, field]) => ({
        name: fieldName,
        type: typeToString(field.type),
        required: isNonNull(field.type),
      })),
    });
  }

  return inputTypes;
}

// ---------------------------------------------------------------------------
// Main analysis function
// ---------------------------------------------------------------------------

/**
 * Analyse a GraphQLSchema and return a structured summary containing types,
 * relationships, entry points, enums, and input types.
 */
export function analyzeSchema(schema: GraphQLSchema): SchemaAnalysis {
  const relationships = extractRelationships(schema);
  const entryPoints = extractEntryPoints(schema);
  const types = extractTypes(schema, relationships);
  const enums = extractEnums(schema);
  const inputTypes = extractInputTypes(schema);

  return { types, relationships, entryPoints, enums, inputTypes };
}

// ---------------------------------------------------------------------------
// LLM context generator
// ---------------------------------------------------------------------------

/**
 * Convert a `SchemaAnalysis` into a structured text format optimised for
 * consumption by an LLM. The output describes the graph structure, entry
 * points, enums, and input types in a concise, human-readable way.
 */
export function generateLLMContext(analysis: SchemaAnalysis): string {
  const sections: string[] = [];

  // --- Types and Relationships ---
  if (analysis.relationships.length > 0) {
    const lines = analysis.relationships.map((r) => {
      const cardinality = r.isList ? '1:N' : '1:1';
      return `- ${r.fromType} -> ${r.toType} (via field "${r.field}", ${cardinality})`;
    });
    sections.push(`### Types and Relationships\n${lines.join('\n')}`);
  }

  // --- Object types with fields ---
  if (analysis.types.length > 0) {
    const typeBlocks = analysis.types.map((t) => {
      const fieldLines = t.fields
        .map((f) => {
          const tag = f.isRelation ? ' [relation]' : '';
          return `  - ${f.name}: ${f.type}${tag}`;
        })
        .join('\n');
      const desc = t.description ? ` — ${t.description}` : '';
      return `- ${t.name}${desc}\n${fieldLines}`;
    });
    sections.push(`### Object Types\n${typeBlocks.join('\n')}`);
  }

  // --- Entry points: Queries ---
  const queries = analysis.entryPoints.filter((e) => e.type === 'query');
  if (queries.length > 0) {
    const lines = queries.map((q) => {
      const args = q.args.length
        ? `(${q.args.map((a) => `${a.name}: ${a.type}`).join(', ')})`
        : '()';
      return `- ${q.name}${args}: ${q.returnType}`;
    });
    sections.push(`### Entry Points (Queries)\n${lines.join('\n')}`);
  }

  // --- Entry points: Mutations ---
  const mutations = analysis.entryPoints.filter((e) => e.type === 'mutation');
  if (mutations.length > 0) {
    const lines = mutations.map((m) => {
      const args = m.args.length
        ? `(${m.args.map((a) => `${a.name}: ${a.type}`).join(', ')})`
        : '()';
      return `- ${m.name}${args}: ${m.returnType}`;
    });
    sections.push(`### Entry Points (Mutations)\n${lines.join('\n')}`);
  }

  // --- Enums ---
  if (analysis.enums.length > 0) {
    const lines = analysis.enums.map(
      (e) => `- ${e.name}: ${e.values.join(', ')}`,
    );
    sections.push(`### Enums\n${lines.join('\n')}`);
  }

  // --- Input types ---
  if (analysis.inputTypes.length > 0) {
    const lines = analysis.inputTypes.map((it) => {
      const fields = it.fields
        .map((f) => `${f.name}: ${f.type}`)
        .join(', ');
      return `- ${it.name}: { ${fields} }`;
    });
    sections.push(`### Input Types\n${lines.join('\n')}`);
  }

  return `## Graph Structure\n\n${sections.join('\n\n')}`;
}
