# Apollo Dashboard – Initial PRD (Draft for Expansion)

You are a senior product engineer.

This document is an initial Product Requirement Draft.
Your task is to refine and expand this into a detailed technical PRD
including architecture decisions, folder structure, data flow diagrams,
and implementation milestones.

---

# 1. Product Overview

Project Name: **apollo-dashboard**

Goal:

Build a **Schema-aware AI-powered GraphQL Query Dashboard**
that converts natural language into valid GraphQL queries using Gemini API,
validates them against the schema, executes them via Apollo Server,
and displays results in a polished React CSR UI.

This is a learning-focused but production-structured project.

---

# 2. Core Objectives

1. Natural language → GraphQL query generation
2. Schema-aware prompt construction
3. Query validation using `graphql.validate()`
4. Retry orchestration on validation failure
5. Query execution via Apollo Server
6. Clean, modern, responsive dashboard UI
7. CI/CD deployment via GitHub Actions

---

# 3. Tech Stack

Frontend:
- React (CSR only)
- TypeScript
- Apollo Client
- Modern UI styling (choose one: Tailwind or CSS Modules)
- Clean dashboard aesthetic (minimal, developer-tool style)

Backend:
- Node.js
- Apollo Server
- GraphQL
- TypeScript

AI Layer:
- Gemini API (gemini-1.5-flash initially)
- LLM abstraction layer for future provider switching

Deployment:
- GitHub Actions CI/CD
- Deploy frontend and backend separately
- Environment variable management for API keys
- Production-ready build setup

---

# 4. Key Functional Requirements

## 4.1 AI Query Generation Flow

User Input (Natural Language)
→ Schema Injection
→ Gemini API Call
→ Generated Query
→ GraphQL Validation
→ If invalid: Retry with correction prompt
→ Execute Query
→ Return Result

---

## 4.2 Backend Requirements

- Modular folder structure
- Clear separation:
    - schema/
    - resolvers/
    - ai/
    - orchestration/
    - validation/
- POST /ai-query endpoint
- Schema introspection support
- Prompt builder utility
- Retry logic (max 2 attempts)

---

## 4.3 Frontend Requirements

The UI should feel like a lightweight developer tool.

Required Components:

- Natural language input panel
- Generated GraphQL query preview (syntax highlighted)
- Validation status indicator (success / retry / error)
- Result viewer:
    - JSON view
    - Auto table rendering when possible
- Loading states and transitions

Design Guidelines:

- Clean spacing
- Subtle animation
- Dark mode default
- Developer-tool aesthetic (similar to GraphQL Playground style)
- Responsive layout

Do not overdesign.
Focus on clarity and usability.

---

# 5. Non-Functional Requirements

- Clean architecture
- Extensible AI provider layer
- Error handling and edge-case management
- Logging for orchestration flow
- Avoid tight coupling between AI and execution layer

---

# 6. CI/CD & Deployment

Use GitHub Actions to:

- Install dependencies
- Run TypeScript build
- Run lint
- Build production artifacts
- Deploy automatically on main branch merge

Include:
- Separate workflow for frontend and backend
- Secure handling of Gemini API key via GitHub Secrets
- Clear README deployment instructions

---

# 7. Constraints

- Do not overengineer
- Keep MVP achievable within 1–2 weeks
- Maintain clarity over complexity
- Avoid premature optimization

---

# 8. Deliverable for This Task

You must:

1. Expand this into a detailed technical PRD
2. Define folder structure clearly
3. Describe data flow between layers
4. Propose implementation milestones
5. Identify risks and mitigation strategies

Think step by step.
Design before coding.
Do not skip architectural reasoning.