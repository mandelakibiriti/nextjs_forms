# ─── FormForge Builder UI — Multi-stage Docker build ─────────────────────────

# Stage 1: base image with pnpm
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2: install + build
# Manifests are copied first so the install layer is cached until they change
FROM base AS builder
WORKDIR /app

# Copy manifests first — keeps install layer cached while source changes
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/schema-core/package.json ./packages/schema-core/
COPY packages/sdk-react/package.json ./packages/sdk-react/
COPY apps/builder/package.json ./apps/builder/

# Install all workspace dependencies
RUN pnpm install --frozen-lockfile || pnpm install --no-frozen-lockfile

# Copy all source files
COPY tsconfig.base.json ./
COPY packages/schema-core ./packages/schema-core
COPY packages/sdk-react ./packages/sdk-react
COPY apps/builder ./apps/builder

# 1. Build schema-core (sdk-react and builder both depend on its compiled types)
RUN pnpm --filter @formforge/schema-core build

# 2. Build the React SDK (builder imports it directly in preview panel)
RUN pnpm --filter @formforge/react build

# 3. Build the Vite SPA (VITE_API_URL is baked into the JS bundle at build time)
ARG VITE_API_URL=http://localhost:3001
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm --filter @formforge/builder build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 3: Nginx to serve the compiled static files
FROM nginx:1.27-alpine AS runner

COPY --from=builder /app/apps/builder/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost/health || exit 1
