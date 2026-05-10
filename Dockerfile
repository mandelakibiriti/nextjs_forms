# ─── FormForge API — Multi-stage Docker build ────────────────────────────────

# Stage 1: base image with pnpm
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
# Bypass TLS verification for corporate proxy environments with self-signed certs
RUN npm config set strict-ssl false && npm install -g pnpm@9.15.0 --quiet \
    && pnpm config set strict-ssl false --global

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2: install + build
# Manifests are copied first so the install layer is cached until they change
FROM base AS builder
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/schema-core/package.json ./packages/schema-core/
COPY apps/api/package.json ./apps/api/

RUN pnpm install --frozen-lockfile || pnpm install --no-frozen-lockfile

# Copy all source files
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

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /deployment .

RUN chmod +x entrypoint.sh

EXPOSE 3001

# nc (netcat) is built into BusyBox on Alpine — no extra packages needed
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

ENTRYPOINT ["sh", "entrypoint.sh"]
