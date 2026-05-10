# ─── FormForge API — Multi-stage Docker build ────────────────────────────────
# Stage 1: base with pnpm
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2: install all workspace dependencies
FROM base AS installer
WORKDIR /app

# Copy manifests first for layer caching
COPY package.json pnpm-workspace.yaml ./
COPY packages/schema-core/package.json ./packages/schema-core/
COPY apps/api/package.json ./apps/api/

# Install — no lockfile required on first build; CI will have pnpm-lock.yaml
RUN pnpm install --no-frozen-lockfile

# ─────────────────────────────────────────────────────────────────────────────
# Stage 3: build schema-core + API, generate Drizzle migrations
FROM base AS builder
WORKDIR /app

COPY --from=installer /app/node_modules ./node_modules
COPY --from=installer /app/packages/schema-core/node_modules ./packages/schema-core/node_modules 2>/dev/null || true
COPY --from=installer /app/apps/api/node_modules ./apps/api/node_modules 2>/dev/null || true

# Copy full source
COPY tsconfig.base.json ./
COPY packages/schema-core ./packages/schema-core
COPY apps/api ./apps/api

# Build schema-core (API depends on its compiled output)
RUN pnpm --filter @formforge/schema-core build

# Generate Drizzle migration SQL files from schema (no DB connection needed)
RUN cd apps/api && pnpm db:generate

# Compile TypeScript → JS (including migrate.ts)
RUN pnpm --filter @formforge/api build

# Create a standalone production deployment via pnpm deploy
RUN pnpm --filter @formforge/api --prod deploy /deployment

# Copy migration files and entrypoint into the deployment directory
RUN cp -r apps/api/drizzle /deployment/drizzle
RUN cp apps/api/entrypoint.sh /deployment/entrypoint.sh

# ─────────────────────────────────────────────────────────────────────────────
# Stage 4: minimal production image
FROM node:22-alpine AS runner
WORKDIR /app

RUN apk add --no-cache postgresql-client

ENV NODE_ENV=production

COPY --from=builder /deployment .

RUN chmod +x entrypoint.sh

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

ENTRYPOINT ["sh", "entrypoint.sh"]
