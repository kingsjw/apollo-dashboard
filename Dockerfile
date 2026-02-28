FROM oven/bun:1 AS builder

WORKDIR /app

COPY package.json bun.lock turbo.json ./
COPY packages/ ./packages/
COPY apps/server/ ./apps/server/

RUN bun install --frozen-lockfile
RUN bun run build --filter=@apollo-dashboard/server

FROM node:22-slim

WORKDIR /app

COPY --from=builder /app/apps/server/dist ./dist
COPY --from=builder /app/apps/server/node_modules ./node_modules
COPY --from=builder /app/packages/shared/dist ./node_modules/@apollo-dashboard/shared/dist
COPY --from=builder /app/packages/shared/package.json ./node_modules/@apollo-dashboard/shared/package.json

ENV NODE_ENV=production
EXPOSE 4000

CMD ["node", "dist/index.js"]
