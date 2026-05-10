# ─── FormForge API — Multi-stage Docker build ────────────────────────────────

# Stage 1: base image with pnpm
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2: install + build
# Layered so that "pnpm install" is re-run only when package manifests change
FROM base AS builder
WORKDIR /app

# Copy manifests first — Docker caches this layer until any package.json changes
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/schema-core/package.json ./packages/schema-core/
COPY apps/api/package.json ./apps/api/

# Install all workspace dependencies
RUN pnpm install --frozen-lockfile || pnpm install --no-frozen-lockfile

# Copy the rest of the source files
COPY tsconfig.base.json ./
COPY packages/schema-core ./packages/schema-core
COPY apps/api ./apps/api

# 1. Build schema-core (API TypeScript imports its compiled output)
RUN pnpm --filter @formforge/schema-core build

# 2. Generate Drizzle SQL migration files from schema.ts (no DB connection needed)
RUN cd apps/api && DATABASE_URL=postgresql://placeholder/placeholder pnpm db:generate

# 3. Compile API TypeScript → JavaScript
RUN pnpm --filter @formforge/api build

# 4. Create a standalone flat deployment — resolves all workspace deps, no symlinks
RUN pnpm --filter @formforge/api --prod deploy /deployment

# 5. Include migration files and startup script in the deployment
RUN cp -r apps/api/drizzle /deployment/drizzle
RUN cp apps/api/entrypoint.sh /deployment/entrypoint.sh

# ─────────────────────────────────────────────────────────────────────────────
# Stage 3: minimal production runtime image
FROM node:22-alpine AS runner

# postgresql-client provides pg_isready for the startup health-check wait
RUN apk add --no-cache postgresql-client

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /deployment .

RUN chmod +x entrypoint.sh

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

ENTRYPOINT ["sh", "entrypoint.sh"]
