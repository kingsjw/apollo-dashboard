# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**apollo-dashboard** — A schema-aware AI-powered GraphQL Query Dashboard that converts natural language into valid GraphQL queries using Gemini API, validates them against the schema, executes them via Apollo Server, and displays results in a React CSR dashboard.

This is a greenfield project. The PRD lives at `docs/PRD.md`.

## Tech Stack

- **Frontend:** React (CSR only), TypeScript, Apollo Client
- **Backend:** Node.js, Apollo Server, TypeScript
- **AI Layer:** Google Gemini API (gemini-1.5-flash), with an abstraction layer for future provider switching
- **CI/CD:** GitHub Actions (separate frontend/backend workflows)

## Architecture

### Data Flow

```
Natural Language Input → Schema Injection → Gemini API → Generated Query
→ graphql.validate() → [Invalid? Retry max 2x] → Execute via Apollo Server → Result
```

### Backend Structure (Planned)

- `schema/` — GraphQL type definitions
- `resolvers/` — GraphQL resolvers
- `ai/` — LLM provider abstraction and Gemini integration
- `orchestration/` — Query generation + execution flow coordination
- `validation/` — GraphQL validation utilities

Key endpoint: `POST /ai-query` — accepts natural language, returns generated query + validation status + execution result.

### Frontend Structure (Planned)

Core components: QueryInput (natural language), QueryPreview (syntax-highlighted GraphQL), ValidationStatus, ResultViewer (JSON tree + auto-table).

Design: dark mode default, developer-tool aesthetic (GraphQL Playground style), minimal and responsive.

## Key Design Decisions

- **CSR only** — no SSR complexity
- **AI provider abstraction** — the AI layer must be decoupled so providers can be swapped without changing orchestration code
- **Retry orchestration** — max 2 retry attempts on validation failure with correction prompts
- **Loose coupling** — AI layer and execution layer are independent
- **No overengineering** — MVP target is 1-2 weeks, clarity over complexity
