# ─── FormForge Builder UI — Multi-stage Docker build ─────────────────────────
# Stage 1: base with pnpm
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2: install all workspace dependencies
FROM base AS installer
WORKDIR /app

COPY package.json pnpm-workspace.yaml ./
COPY packages/schema-core/package.json ./packages/schema-core/
COPY apps/builder/package.json ./apps/builder/

RUN pnpm install --no-frozen-lockfile

# ─────────────────────────────────────────────────────────────────────────────
# Stage 3: build schema-core + builder UI
FROM base AS builder
WORKDIR /app

COPY --from=installer /app/node_modules ./node_modules
COPY --from=installer /app/packages/schema-core/node_modules ./packages/schema-core/node_modules 2>/dev/null || true
COPY --from=installer /app/apps/builder/node_modules ./apps/builder/node_modules 2>/dev/null || true

COPY tsconfig.base.json ./
COPY packages/schema-core ./packages/schema-core
COPY apps/builder ./apps/builder

# Build schema-core first (builder depends on its types)
RUN pnpm --filter @formforge/schema-core build

# Build the React/Vite SPA (VITE_API_URL is baked in at build time)
ARG VITE_API_URL=http://localhost:3001
ENV VITE_API_URL=$VITE_API_URL

RUN pnpm --filter @formforge/builder build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 4: Nginx to serve static files
FROM nginx:1.27-alpine AS runner

COPY --from=builder /app/apps/builder/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost/health || exit 1
