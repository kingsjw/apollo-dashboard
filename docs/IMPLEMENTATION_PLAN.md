# Apollo Dashboard — Implementation Plan

## Phase 0: Documentation Discovery (완료)

### 확정된 기술 스택

| 항목 | 선택 | 버전/비고 |
|---|---|---|
| Package Manager | bun | v1.2+ |
| Monorepo | Turborepo | v2.6+ (bun stable 지원) |
| Backend Server | Apollo Server 5 | `@apollo/server` + `@as-integrations/express4` |
| GraphQL | graphql | ≥ 16.11.0 |
| Express | Express 4 | Apollo Server 5 연동용 |
| AI SDK | `@google/genai` | ~~`@google/generative-ai`는 deprecated~~ |
| AI Model | `gemini-2.5-flash` | 무료 티어 (10 RPM / 250 RPD / 250K TPM) |
| Frontend | Vite + React 18 + TypeScript | `react-ts` template |
| Apollo Client | `@apollo/client@3` | v4는 rxjs 필요, v3으로 진행 |
| Styling | Tailwind CSS v4 | `@tailwindcss/vite` 플러그인 |
| GraphQL Highlighting | `react-syntax-highlighter` | Prism + vscDarkPlus 테마 |
| JSON Viewer | `react-json-view-lite` | 제로 의존성, React 18 호환 |
| 공유 타입 | `@apollo-dashboard/shared` | workspace 패키지 |
| 배포 (Frontend) | Vercel | Vite 정적 빌드 배포 |
| 배포 (Backend) | Render | Node.js 서비스 |
| GraphQL 도메인 | 전자상거래 | Product, Order, User, Category |

### Allowed APIs (문서 확인 완료)

- `@apollo/server`: `new ApolloServer({ typeDefs, resolvers, plugins })` → `await server.start()` → `expressMiddleware(server)`
- `@as-integrations/express4`: `expressMiddleware` import 경로
- `graphql`: `parse(queryString)` → `validate(schema, documentAST)` → `ReadonlyArray<GraphQLError>`
- `@google/genai`: `new GoogleGenAI({ apiKey })` → `ai.models.generateContent({ model, contents, config })`
- Response: `response.text` (string)

### Anti-Pattern Guards (전체 Phase 공통)

- `@google/generative-ai` 사용 금지 (deprecated)
- Apollo Server 4 패턴 사용 금지 (`@apollo/server/express4` import 경로)
- `startStandaloneServer` 사용 금지 (커스텀 REST 라우트 불가)
- `gemini-1.5-flash` / `gemini-2.0-flash` 사용 금지 (retired/retiring)
- `validate()`에 raw string 전달 금지 — 반드시 `parse()` 먼저 호출

---

## Phase 1: Turborepo 모노레포 초기 셋업

### 목표
프로젝트 스캐폴딩 + 모노레포 구조 확립 + 빌드/dev 파이프라인 동작 확인

### 구현 내용

#### 1.1 프로젝트 초기화

```
apollo-dashboard/
├── apps/
│   ├── client/          # React + Vite 프론트엔드
│   └── server/          # Express + Apollo Server 백엔드
├── packages/
│   ├── shared/          # 공유 TypeScript 타입
│   └── typescript-config/  # 공유 tsconfig
├── turbo.json
├── package.json
└── .gitignore
```

#### 1.2 Root package.json

```json
{
  "name": "apollo-dashboard",
  "private": true,
  "packageManager": "bun@1.2.0",
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "type-check": "turbo type-check"
  },
  "devDependencies": {
    "turbo": "latest"
  }
}
```

#### 1.3 turbo.json

```json
{
  "$schema": "https://turborepo.dev/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "outputs": []
    },
    "type-check": {
      "dependsOn": ["^build"],
      "outputs": []
    }
  }
}
```

#### 1.4 공유 타입 패키지 (`packages/shared`)

```typescript
// packages/shared/src/index.ts
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
```

### 검증 체크리스트
- [ ] `bun install` 성공
- [ ] `bun run dev` → client(Vite)와 server(tsx watch) 동시 실행
- [ ] `bun run build` → 양쪽 빌드 성공
- [ ] `packages/shared`의 타입이 apps에서 import 가능

---

## Phase 2: Backend — Apollo Server + GraphQL 스키마

### 목표
Apollo Server 5 구동 + 샘플 GraphQL 스키마/리졸버 + `/ai-query` REST 엔드포인트 스텁

### 구현 내용

#### 2.1 패키지 설치 (apps/server)

```bash
bun add @apollo/server @as-integrations/express4 graphql express cors --cwd apps/server
bun add -d @types/express @types/cors tsx typescript --cwd apps/server
```

#### 2.2 디렉토리 구조

```
apps/server/src/
├── index.ts              # Express + Apollo Server 진입점
├── schema/
│   └── typeDefs.ts       # GraphQL SDL 정의
├── resolvers/
│   └── index.ts          # 리졸버 통합
├── ai/
│   ├── provider.ts       # AI provider 추상 인터페이스
│   └── gemini.ts         # Gemini 구현체 (Phase 3)
├── orchestration/
│   └── queryOrchestrator.ts  # 생성→검증→실행 흐름 (Phase 3)
└── validation/
    └── validateQuery.ts  # graphql.validate() 래퍼
```

#### 2.3 서버 진입점 패턴 (Apollo Server 5)

```typescript
// apps/server/src/index.ts
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import http from 'http';
import cors from 'cors';

const app = express();
const httpServer = http.createServer(app);

const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});

await server.start();

app.use('/graphql', cors(), express.json(), expressMiddleware(server));
app.post('/ai-query', express.json(), aiQueryHandler);  // Phase 3에서 구현

httpServer.listen(4000);
```

#### 2.4 샘플 GraphQL 스키마

전자상거래 도메인:

```graphql
type Product {
  id: ID!
  name: String!
  description: String
  price: Float!
  category: Category!
  inStock: Boolean!
  imageUrl: String
}

type Order {
  id: ID!
  user: User!
  items: [OrderItem!]!
  totalAmount: Float!
  status: OrderStatus!
  createdAt: String!
}

type OrderItem {
  product: Product!
  quantity: Int!
  unitPrice: Float!
}

type User {
  id: ID!
  name: String!
  email: String!
  orders: [Order!]!
}

type Category {
  id: ID!
  name: String!
  products: [Product!]!
}

enum OrderStatus { PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED }

type Query {
  products: [Product!]!
  product(id: ID!): Product
  orders: [Order!]!
  order(id: ID!): Order
  users: [User!]!
  user(id: ID!): User
  categories: [Category!]!
}

type Mutation {
  createOrder(userId: ID!, items: [OrderItemInput!]!): Order!
  cancelOrder(id: ID!): Order!
  addProduct(name: String!, price: Float!, categoryId: ID!): Product!
}

input OrderItemInput {
  productId: ID!
  quantity: Int!
}
```

#### 2.5 Validation 유틸리티

```typescript
// apps/server/src/validation/validateQuery.ts
import { parse, validate } from 'graphql';
import type { GraphQLSchema, GraphQLError } from 'graphql';

export function validateGeneratedQuery(
  schema: GraphQLSchema,
  queryString: string
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
```

### 검증 체크리스트
- [ ] `bun run dev` → 서버 http://localhost:4000/graphql 접근 가능
- [ ] Apollo Sandbox에서 샘플 쿼리 실행 성공
- [ ] `POST /ai-query` 엔드포인트 응답 (스텁)
- [ ] `validateGeneratedQuery()` 유효/무효 쿼리 테스트 통과

---

## Phase 3: AI Layer — Gemini 연동 + 오케스트레이션

### 목표
LLM 추상화 레이어 구현 + Gemini 연동 + 생성→검증→재시도→실행 오케스트레이션 완성

### 구현 내용

#### 3.1 패키지 설치

```bash
bun add @google/genai --cwd apps/server
```

#### 3.2 AI Provider 추상화

```typescript
// apps/server/src/ai/provider.ts
export interface AIProvider {
  generateQuery(
    naturalLanguage: string,
    schemaSDL: string,
    previousErrors?: string[]
  ): Promise<string>;
}
```

```typescript
// apps/server/src/ai/gemini.ts
import { GoogleGenAI } from '@google/genai';
import type { AIProvider } from './provider';

export class GeminiProvider implements AIProvider {
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateQuery(
    naturalLanguage: string,
    schemaSDL: string,
    previousErrors?: string[]
  ): Promise<string> {
    const prompt = this.buildPrompt(naturalLanguage, schemaSDL, previousErrors);

    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'You are a GraphQL query generator. Output ONLY the raw GraphQL query. No markdown, no explanation, no code fences.',
        temperature: 0.2,
        maxOutputTokens: 1024,
      },
    });

    return response.text.trim();
  }

  private buildPrompt(nl: string, schema: string, errors?: string[]): string {
    let prompt = `GraphQL Schema:\n${schema}\n\nRequest: ${nl}`;
    if (errors?.length) {
      prompt += `\n\nPrevious attempt had these validation errors:\n${errors.join('\n')}\nPlease fix them.`;
    }
    return prompt;
  }
}
```

#### 3.3 오케스트레이션 (생성 → 검증 → 재시도 → 실행)

```typescript
// apps/server/src/orchestration/queryOrchestrator.ts
import type { AIProvider } from '../ai/provider';
import { validateGeneratedQuery } from '../validation/validateQuery';
import { graphql } from 'graphql';
import type { GraphQLSchema } from 'graphql';

const MAX_RETRIES = 2;

export async function orchestrateQuery(
  provider: AIProvider,
  schema: GraphQLSchema,
  schemaSDL: string,
  naturalLanguage: string
): Promise<AIQueryResponse> {
  let attempt = 0;
  let queryString = '';
  let lastErrors: string[] = [];

  while (attempt <= MAX_RETRIES) {
    queryString = await provider.generateQuery(naturalLanguage, schemaSDL, lastErrors.length ? lastErrors : undefined);

    const { valid, errors } = validateGeneratedQuery(schema, queryString);

    if (valid) {
      const result = await graphql({ schema, source: queryString });
      return {
        query: queryString,
        validationStatus: attempt > 0 ? 'corrected' : 'valid',
        result: result.data,
        error: result.errors?.[0]?.message,
        retryCount: attempt,
      };
    }

    lastErrors = errors.map(e => e.message);
    attempt++;
  }

  return {
    query: queryString,
    validationStatus: 'invalid',
    error: `Validation failed after ${MAX_RETRIES} retries: ${lastErrors.join(', ')}`,
    retryCount: MAX_RETRIES,
  };
}
```

#### 3.4 `/ai-query` 엔드포인트 연결

```typescript
app.post('/ai-query', express.json(), async (req, res) => {
  const { naturalLanguage } = req.body as AIQueryRequest;
  const result = await orchestrateQuery(geminiProvider, schema, schemaSDL, naturalLanguage);
  res.json(result);
});
```

### 검증 체크리스트
- [ ] `GEMINI_API_KEY` 환경변수 설정 후 서버 기동
- [ ] `POST /ai-query { "naturalLanguage": "모든 프로젝트 목록" }` → 유효한 GraphQL 쿼리 + 실행 결과 반환
- [ ] 의도적으로 애매한 입력 → 재시도 로직 동작 확인
- [ ] AI provider를 모킹하여 검증 실패 시 재시도 횟수 확인

---

## Phase 4: Frontend — React Dashboard UI

### 목표
자연어 입력 → 쿼리 미리보기 → 검증 상태 → 결과 뷰어 대시보드 완성

### 구현 내용

#### 4.1 패키지 설치 (apps/client)

```bash
bun add @apollo/client@3 graphql react-syntax-highlighter react-json-view-lite --cwd apps/client
bun add -d @types/react-syntax-highlighter tailwindcss @tailwindcss/vite --cwd apps/client
```

#### 4.2 컴포넌트 구조

```
apps/client/src/
├── main.tsx              # ApolloProvider + App 마운트
├── App.tsx               # 메인 레이아웃
├── api/
│   └── aiQuery.ts        # POST /ai-query fetch 유틸
├── components/
│   ├── QueryInput.tsx    # 자연어 입력 패널
│   ├── QueryPreview.tsx  # GraphQL 구문 하이라이팅
│   ├── ValidationStatus.tsx  # 검증 상태 표시
│   └── ResultViewer.tsx  # JSON 트리 + 자동 테이블
├── hooks/
│   └── useAIQuery.ts     # AI 쿼리 커스텀 훅
└── index.css             # Tailwind 진입점
```

#### 4.3 핵심 컴포넌트 패턴

**QueryInput**: textarea + 전송 버튼, 로딩 상태 관리
**QueryPreview**: `react-syntax-highlighter` + Prism + `vscDarkPlus` 테마
**ValidationStatus**: valid(초록) / corrected(노랑) / invalid(빨강) 뱃지
**ResultViewer**: `react-json-view-lite` 트리뷰 (가독성 있는 JSON 표시만, 별도 UI 렌더링 없음)

#### 4.4 디자인 시스템

- 다크 모드 기본 (`bg-gray-950`, `text-gray-100`)
- 모노스페이스 코드 영역 (`font-mono`)
- GraphQL Playground 스타일 미학
- 반응형 레이아웃 (모바일 → 데스크톱)

### 검증 체크리스트
- [ ] `bun run dev` → http://localhost:5173 접근 가능
- [ ] 자연어 입력 → 백엔드 호출 → 쿼리 미리보기 표시
- [ ] 검증 상태 뱃지 정상 표시 (valid/corrected/invalid)
- [ ] JSON 결과 트리뷰 렌더링 (접기/펼치기 가능한 가독성 있는 JSON)
- [ ] 로딩/에러 상태 처리

---

## Phase 5: 통합 + CI/CD + 배포 + 마무리

### 목표
프론트-백엔드 통합 테스트 + GitHub Actions 워크플로우 + Vercel/Render 배포 + 환경변수 관리

### 구현 내용

#### 5.1 GitHub 레포 생성 + Actions 워크플로우

```bash
git init && gh repo create apollo-dashboard --public --source=.
```

```
.github/workflows/
├── ci.yml           # PR 시 lint + type-check + build (Turborepo 캐싱)
```

Turborepo의 Remote Caching 활용으로 CI 속도 최적화.

#### 5.2 배포 설정

**Frontend → Vercel**
- Framework: Vite
- Root Directory: `apps/client`
- Build Command: `cd ../.. && bun run build --filter=@apollo-dashboard/client`
- Output Directory: `apps/client/dist`
- 환경변수: `VITE_API_URL` = Render 백엔드 URL

**Backend → Render**
- Environment: Node.js
- Root Directory: `apps/server`
- Build Command: `bun install && bun run build`
- Start Command: `bun run start`
- 환경변수: `GEMINI_API_KEY`, `PORT`, `CORS_ORIGIN` (Vercel 도메인)

#### 5.3 환경변수 관리

```
apps/server/.env.example
  GEMINI_API_KEY=your-key-here
  PORT=4000
  CORS_ORIGIN=http://localhost:5173

apps/client/.env.example
  VITE_API_URL=http://localhost:4000
```

GitHub Secrets: `GEMINI_API_KEY`
Render Environment: `GEMINI_API_KEY`, `CORS_ORIGIN`
Vercel Environment: `VITE_API_URL`

#### 5.4 CORS 설정

개발: `localhost:5173` 허용
프로덕션: Vercel 배포 도메인 허용 (`CORS_ORIGIN` 환경변수)

### 검증 체크리스트
- [ ] `bun run dev` → 프론트+백엔드 동시 기동, 풀 플로우 동작
- [ ] `bun run build` → 프로덕션 빌드 성공
- [ ] `bun run lint` + `bun run type-check` 통과
- [ ] GitHub Actions CI 파이프라인 그린
- [ ] `.env.example` 파일 존재, 실제 키는 `.gitignore` 처리
- [ ] Vercel 프론트엔드 배포 + Render 백엔드 배포 성공
- [ ] 프로덕션 환경에서 자연어 → 쿼리 생성 → 실행 풀 플로우 동작

---

## 구현 순서 요약

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5
(셋업)    (백엔드)   (AI레이어)  (프론트)   (CI/CD)
```

각 Phase는 독립적으로 검증 가능하며, 이전 Phase 완료 후 진행합니다.

**예상 파일 수**: ~25-30개
**핵심 의존성**: 12개 패키지
